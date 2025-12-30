const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { jobIds, jobData } = event || {}

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
    return {
      success: false,
      message: 'jobIds参数无效',
    }
  }

  try {
    // 批量查询这些jobId是否已经被当前用户收藏
    const existingRes = await db
      .collection('saved_jobs')
      .where({
        openid,
        jobId: db.command.in(jobIds),
      })
      .get()

    const existingJobIds = new Set((existingRes.data || []).map(item => item.jobId))

    // 过滤出未收藏的jobId
    const jobIdsToSave = jobIds.filter(jobId => !existingJobIds.has(jobId))

    if (jobIdsToSave.length === 0) {
      return {
        success: true,
        savedCount: 0,
        message: '所有职位已收藏',
      }
    }

    // 准备批量插入的数据
    const now = new Date()
    const recordsToInsert = jobIdsToSave.map(jobId => {
      const jobInfo = jobData && jobData[jobId] ? jobData[jobId] : {}
      return {
        openid,
        jobId,
        type: jobInfo.type || '',
        createdAt: jobInfo.createdAt || now,
      }
    })

    // 批量插入（分批处理，每批最多100条）
    // 参考成熟产品做法：使用批量操作 + 错误处理，既保证性能又保证安全性
    const batchSize = 100
    let savedCount = 0
    const errors = []
    const duplicateJobIds = [] // 记录重复的jobId（用于统计）

    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const chunk = recordsToInsert.slice(i, i + batchSize)
      
      // 对这批数据再次检查是否存在（防止并发插入导致的重复）
      // 这是成熟产品常用的"双重检查"策略
      const chunkJobIds = chunk.map(r => r.jobId).filter(Boolean)
      if (chunkJobIds.length > 0) {
        const doubleCheckRes = await db
          .collection('saved_jobs')
          .where({
            openid,
            jobId: db.command.in(chunkJobIds),
          })
          .get()
        
        const doubleCheckIds = new Set((doubleCheckRes.data || []).map(item => item.jobId))
        // 过滤掉在双重检查时发现已存在的记录
        const chunkToInsert = chunk.filter(record => {
          if (doubleCheckIds.has(record.jobId)) {
            duplicateJobIds.push(record.jobId)
            return false
          }
          return true
        })
        
        if (chunkToInsert.length > 0) {
          // 使用Promise.all并行插入，参考成熟产品的做法
          // 这种方式既保证性能，又能通过错误处理保证安全性
          const insertPromises = chunkToInsert.map(record => 
            db.collection('saved_jobs').add({ data: record }).catch(err => {
              // 捕获重复插入错误（errCode通常为-1或其他特定值）
              // 如果是重复错误，记录但不计入错误（因为这是预期的，可能是并发导致）
              const isDuplicate = err.errCode === -1 || 
                                 (err.errMsg && err.errMsg.includes('duplicate')) ||
                                 (err.message && err.message.includes('duplicate')) ||
                                 (err.errMsg && err.errMsg.includes('重复')) ||
                                 (err.message && err.message.includes('重复'))
              
              if (isDuplicate) {
                duplicateJobIds.push(record.jobId)
              } else {
                // 其他错误才记录
                errors.push({
                  jobId: record.jobId,
                  error: err.message || err.errMsg || 'unknown error',
                  errCode: err.errCode,
                })
              }
              return null
            })
          )
          
          const results = await Promise.all(insertPromises)
          savedCount += results.filter(r => r !== null).length
        }
      }
    }

    return {
      success: true,
      savedCount,
      totalRequested: jobIds.length,
      skipped: jobIds.length - savedCount,
      duplicateCount: duplicateJobIds.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (err) {
    console.error('batchSaveJobs error:', {
      error: err,
      message: err.message,
      stack: err.stack,
      event: event,
    })
    return {
      success: false,
      message: err.message || '批量收藏失败',
      error: err.toString(),
    }
  }
}

