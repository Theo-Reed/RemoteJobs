const cloud = require('wx-server-sdk')
const { matchSalary } = require('./salaryUtils')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { pageSize = 15, skip = 0, source_name, types, salary } = event || {}

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 构建 where 条件
    const whereCondition = {}
    
    // 区域筛选（支持多选）
    if (Array.isArray(types) && types.length > 0) {
      whereCondition.type = db.command.in(types)
    }
    
    // 来源筛选（支持多选）
    if (Array.isArray(source_name) && source_name.length > 0) {
      if (source_name.length === 1) {
        whereCondition.source_name = source_name[0]
      } else {
        whereCondition.source_name = db.command.in(source_name)
      }
    }

    let query = db.collection('remote_jobs')
    
    // 应用筛选条件
    if (Object.keys(whereCondition).length > 0) {
      query = query.where(whereCondition)
    }
    
    // 注意：薪资筛选需要在获取数据后进行，因为需要解析薪资字符串
    // 先获取所有符合其他条件的数据
    const res = await query
      .orderBy('createdAt', 'desc')
      .get()
    
    let jobs = res.data || []
    
    // 应用薪资筛选（如果指定了薪资条件）
    if (salary && salary !== '全部') {
      jobs = jobs.filter(job => {
        const jobSalary = job.salary || ''
        return matchSalary(jobSalary, salary)
      })
    }
    
    // 分页处理（在薪资筛选之后）
    const total = jobs.length
    jobs = jobs.slice(skip, skip + pageSize)

    if (jobs.length > 0 && openid) {
      try {
        const jobIds = jobs.map(job => job._id).filter(Boolean)
        
        if (jobIds.length > 0) {
          const collectedRes = await db
            .collection('saved_jobs')
            .where({
              openid,
              jobId: db.command.in(jobIds),
            })
            .get()
          
          const collectedSet = new Set((collectedRes.data || []).map(item => item.jobId))
          
          jobs = jobs.map(job => ({
            ...job,
            isSaved: collectedSet.has(job._id),
          }))
        }
      } catch (err) {
        jobs = jobs.map(job => ({
          ...job,
          isSaved: false,
        }))
      }
    } else {
      jobs = jobs.map(job => ({
        ...job,
        isSaved: false,
      }))
    }

    return {
      ok: true,
      jobs,
    }
  } catch (err) {
    console.error('getJobList error:', {
      error: err,
      message: err.message,
      stack: err.stack,
      event: event,
    })
    return {
      ok: false,
      error: err.message || 'unknown error',
      details: err.toString(),
    }
  }
}

