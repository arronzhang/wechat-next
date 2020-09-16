module.exports = {
  //User
  getUserInfo: ['get', 'cgi-bin/user/getuserinfo', ['!code']],
  getUser: ['get', 'cgi-bin/user/get', ['!userid']],
  createUser: ['post', 'cgi-bin/user/create'],
  updateUser: ['post', 'cgi-bin/user/update'],
  deleteUser: ['get', 'cgi-bin/user/delete', ['!userid']],
  batchDeleteUser: ['post', 'cgi-bin/user/batchdelete'], //{useridlist}
  //Message
  sendMessage: ['post', 'cgi-bin/message/send'], //{useridlist}
  //Agent
  getAgent: ['get', 'cgi-bin/agent/get', ['!agentid']],
  setAgent: ['post', 'cgi-bin/agent/set'],
  getMenu: ['get', 'cgi-bin/menu/get', ['!agentid']],
  createMenu: ['post', 'cgi-bin/menu/create', ['!agentid']],
  deleteMenu: ['get', 'cgi-bin/menu/delete', ['!agentid']],
  //Media
  uploadMedia: ['post', 'cgi-bin/media/upload', ['!type'], ['media']], //image,voice,video,file
  uploadImg: ['post', 'cgi-bin/media/uploadimg'],
  getMedia: ['get', 'cgi-bin/media/get', ['!media_id']],
  getVoice: ['get', 'cgi-bin/media/get/jssdk', ['!media_id']],
}
