module.exports = {
  //User
  getUserInfo: ['get', 'user/getuserinfo', ['code']],
  getUser: ['get', 'user/get', ['userid']],
  createUser: ['post', 'user/create'],
  //Media
  uploadMedia: ['post', 'media/upload', ['type']], //image,voice,video,file
  uploadImg: ['post', 'media/uploadimg'],
  getMedia: ['get', 'media/get', ['media_id']],
  getVoice: ['get', 'media/get/jssdk', ['media_id']]
}
