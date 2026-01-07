# User Document Schema (数据库用户文档结构)

该文档描述了 `users` 集合中用户文档的字段结构。

## 基础字段 (Basic Fields)
- `openid`: `String` - 用户的唯一标识 (WeChat OpenID)。
- `isAuthed`: `Boolean` - 是否已完成实名/手机号认证。
- `phone`: `String | null` - 账号绑定的主手机号（用于登录/认证）。
- `nickname`: `String` - 用户昵称（默认为随机生成的“用户xxxxxx”）。
- `avatar`: `String` - 用户头像 URL 或 Cloud ID。
- `language`: `String` - 用户选择的界面语言 (e.g., 'Chinese', 'English', 'AIChinese')。
- `inviteCode`: `String` - 用户的个人邀请码。
- `createdAt`: `Date` - 账户创建时间。
- `updatedAt`: `Date` - 最后一次更新时间。

## 会员与配额 (Membership & Quota)
- `membership`: `Object` - 会员权益包裹字段。
  - `level`: `Number` - 会员等级 (0:普通, 1:3天体验, 2:普通月卡, 3:高级月卡)。
  - `expire_at`: `Date | null` - 会员到期时间。
  - `total_ai_usage`: `Object` - AI 总使用量监控。
    - `used`: `Number` - 已使用次数。
    - `limit`: `Number` - 总次数上限。
  - `job_quota`: `Object` - 岗位投递配额。
    - `used`: `Number` - 已投递数量。
    - `limit`: `Number` - 总投递上限。
  - `job_details`: `Object` - 记录每个岗位的交互详情 (e.g., 针对特定 job_id 的微调次数)。

## 简历资料 (Resume Profile)
- `resume_profile`: `Object` - 用户的简历信息（与账号信息独立）。
  - `name`: `String` - 真实姓名。
  - `photo`: `String` - 简历照片 Cloud ID。
  - `gender`: `String` - 性别。
  - `birthday`: `String` - 出生年月 (YYYY-MM)。
  - `identity`: `String` - 身份 (e.g., '在校生', '职场人')。
  - `wechat`: `String` - 简历联系微信。
  - `email`: `String` - 简历联系邮箱。
  - `phone`: `String` - 简历联系电话（独立于账号绑定的 `phone`）。
  - `educations`: `Array<Object>` - 教育经历。
    - `school`: `String`
    - `degree`: `String`
    - `major`: `String`
    - `startDate`: `String`
    - `endDate`: `String`
    - `description`: `String`
  - `certificates`: `Array<String>` - 证书列表。
  - `skills`: `Array<String>` - 技能列表。

## 系统状态 (System Status)
- `resume_completeness`: `Number` - 简历完整度等级。
  - `0`: 不完整（未满足基本信息、教育经历或联系方式三选一）。
  - `1`: 基本完整（已填写必要项，可使用 AI 功能）。
  - `2`: 非常完美（在 1 的基础上填写了证书）。

