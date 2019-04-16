module.exports = {
  //User
  getUserInfo: ['get', 'user/getuserinfo', ['code']],
  getUser: ['get', 'user/get', ['userid']],
  createUser: ['post', 'user/create'],
  updateUser: ['post', 'user/update'],
  deleteUser: ['get', 'user/delete', ['userid']],
  batchDeleteUser: ['post', 'user/batchdelete'], //{useridlist}
  //Message
  sendMessage: ['post', 'message/send'], //{useridlist}
  //Agent
  getAgent: ['get', 'agent/get', ['agentid']],
  setAgent: ['post', 'agent/set'],
  getMenu: ['get', 'menu/get', ['agentid']],
  createMenu: ['post', 'menu/create', ['agentid']],
  deleteMenu: ['get', 'menu/delete', ['agentid']],
  //Media
  uploadMedia: ['post', 'media/upload', ['type']], //image,voice,video,file
  uploadImg: ['post', 'media/uploadimg'],
  getMedia: ['get', 'media/get', ['media_id']],
  getVoice: ['get', 'media/get/jssdk', ['media_id']]
}
