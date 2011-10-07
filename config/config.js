module.exports = config = {
  "name" : "h5-streamer",

  "port" : 3000,

  "fs_cache_time" : 30 * 60 * 1000,

  "extensions" : ['mp4', 'm4v', 'ogg', 'ogv', 'webm'],

  "media" : [
    { "name" : "TV",
      "path" : "/mnt/TV" },
    { "name" : "Music Videos",
      "path" : "/mnt/Music Videos" },
    { "name" : "Movies",
      "path" : "/mnt/Movies" },
  ]
}

