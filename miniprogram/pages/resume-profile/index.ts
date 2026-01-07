// miniprogram/pages/resume-profile/index.ts
import { normalizeLanguage, t } from '../../utils/i18n'
import { attachLanguageAware } from '../../utils/languageAware'

Page({
  data: {
    // 个人信息
    name: '',
    photo: '',
    wechat: '',
    email: '',
    phone: '',
    // 教育经历（可以有多个）
    educations: [] as Array<{ 
      school: string; 
      degree: string; 
      major: string; 
      startDate: string; 
      endDate: string;
      graduationDate?: string; // 兼容旧版
    }>,
    // 证书
    certificates: [] as string[],
    
    // 编辑状态
    showEduDrawer: false,
    editingEduIndex: -1, // -1 表示新增
    eduForm: {
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
    },
    degreeOptions: ['高中', '大专', '本科', '硕士', '博士', '其他'],
    
    // UI 文本
    ui: {} as Record<string, string>,
  },

  onLoad() {
    // attach language-aware behavior
    ;(this as any)._langDetach = attachLanguageAware(this, {
      onLanguageRevive: () => {
        wx.setNavigationBarTitle({ title: '' })
        this.updateLanguage()
      },
    })

    this.updateLanguage()
    this.loadResumeData()
  },

  onUnload() {
    const fn = (this as any)._langDetach
    if (typeof fn === 'function') fn()
    ;(this as any)._langDetach = null
  },

  onShow() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    wx.setNavigationBarTitle({ title: '' })
    this.updateLanguage()
  },

  updateLanguage() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    
    const ui = {
      title: t('resume.title', lang),
      tips: t('resume.tips', lang),
      personalInfo: t('resume.personalInfo', lang),
      contactInfo: t('resume.contactInfo', lang),
      name: t('resume.name', lang),
      photo: t('resume.photo', lang),
      wechat: t('resume.wechat', lang),
      email: t('resume.email', lang),
      phone: t('resume.phone', lang),
      education: t('resume.education', lang),
      certificates: t('resume.certificates', lang),
      graduationDate: t('resume.graduationDate', lang),
      addEducation: t('resume.addEducation', lang),
      addCertificate: t('resume.addCertificate', lang),
      noData: t('resume.noData', lang),
    }

    this.setData({ ui })
  },

  loadResumeData() {
    const app = getApp<IAppOption>() as any
    const user = app?.globalData?.user

    if (user) {
      // 核心改动：使用新的 resume_profile 字段
      const profile = user.resume_profile || {}
      
      this.setData({
        name: profile.name || '',
        photo: profile.photo || '',
        wechat: profile.wechat || '',
        email: profile.email || '',
        phone: profile.phone || user.phone || '', // 兜底使用账户手机号
        educations: profile.educations || [],
        certificates: profile.certificates || [],
      })
    }
  },

  async saveResumeProfile(data: any) {
    try {
      wx.showLoading({ title: '保存中...' })
      const res: any = await wx.cloud.callFunction({
        name: 'updateUserProfile',
        data: { resume_profile: data }
      })
      
      if (res.result?.ok) {
        const app = getApp<IAppOption>() as any
        app.globalData.user = res.result.user
        this.loadResumeData()
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        throw new Error('保存失败')
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // UI Event Handlers
  onEditPhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        try {
          const cloudPath = `resume_photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath,
          })
          await this.saveResumeProfile({ photo: uploadRes.fileID })
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },
  onEditName() {
    wx.showModal({
      title: '编辑姓名',
      placeholderText: '请输入真实姓名',
      editable: true,
      content: this.data.name,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ name: res.content })
        }
      }
    })
  },
  onEditWechat() {
    wx.showModal({
      title: '编辑微信号',
      placeholderText: '请输入微信号',
      editable: true,
      content: this.data.wechat,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ wechat: res.content })
        }
      }
    })
  },
  onEditEmail() {
    wx.showModal({
      title: '编辑邮箱',
      placeholderText: '请输入联系邮箱',
      editable: true,
      content: this.data.email,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ email: res.content })
        }
      }
    })
  },
  onEditPhone() {
    wx.showModal({
      title: '编辑手机号',
      placeholderText: '请输入联系手机号',
      editable: true,
      content: this.data.phone,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ phone: res.content })
        }
      }
    })
  },
  
  // 教育经历相关逻辑
  onAddEducation() {
    this.setData({
      showEduDrawer: true,
      editingEduIndex: -1,
      eduForm: {
        school: '',
        degree: '',
        major: '',
        startDate: '',
        endDate: '',
      }
    })
  },
  onEditEducation(e: any) {
    const index = e.currentTarget.dataset.index
    const edu = this.data.educations[index]
    this.setData({
      showEduDrawer: true,
      editingEduIndex: index,
      eduForm: {
        school: edu.school || '',
        degree: edu.degree || '',
        major: edu.major || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || edu.graduationDate || '', // 兼容
      }
    })
  },
  closeEduDrawer() {
    this.setData({ showEduDrawer: false })
  },
  onEduSchoolInput(e: any) {
    this.setData({ 'eduForm.school': e.detail.value })
  },
  onEduDegreeChange(e: any) {
    this.setData({ 'eduForm.degree': this.data.degreeOptions[e.detail.value] })
  },
  onEduMajorInput(e: any) {
    this.setData({ 'eduForm.major': e.detail.value })
  },
  onEduStartDateChange(e: any) {
    this.setData({ 'eduForm.startDate': e.detail.value })
  },
  onEduEndDateChange(e: any) {
    this.setData({ 'eduForm.endDate': e.detail.value })
  },
  async onSaveEducation() {
    const { eduForm, editingEduIndex, educations } = this.data
    if (!eduForm.school) {
      wx.showToast({ title: '请输入学校', icon: 'none' })
      return
    }

    const newEducations = [...educations]
    const eduData = { ...eduForm }

    if (editingEduIndex === -1) {
      newEducations.push(eduData)
    } else {
      newEducations[editingEduIndex] = eduData
    }

    await this.saveResumeProfile({ educations: newEducations })
    this.closeEduDrawer()
  },
  async onDeleteEducation() {
    const { editingEduIndex, educations } = this.data
    if (editingEduIndex === -1) return

    wx.showModal({
      title: '删除确认',
      content: '确定要删除这段教育经历吗？',
      success: async (res) => {
        if (res.confirm) {
          const newEducations = [...educations]
          newEducations.splice(editingEduIndex, 1)
          await this.saveResumeProfile({ educations: newEducations })
          this.closeEduDrawer()
        }
      }
    })
  },
  
  onAddCertificate() {
    wx.showToast({ title: t('me.comingSoon', normalizeLanguage(getApp().globalData?.language)), icon: 'none' })
  },
  onEditCertificate(e: any) {
    wx.showToast({ title: t('me.comingSoon', normalizeLanguage(getApp().globalData?.language)), icon: 'none' })
  },
})

