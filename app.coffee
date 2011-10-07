express  = require('express')
stylus   = require('stylus')
fs       = require('fs')

config   = require('./config/config')

port = process.env.PORT || 3000

app = express.createServer(express.logger())

app.configure( ->
  app.set('views', __dirname + '/views')
  app.use(express.methodOverride())
  app.use(express.bodyParser())
  app.use(app.router)
  app.use(stylus.middleware({
      src: __dirname + "/public",
      compress: true
  }))
)

app.settings.env = process.env.ENV || 'development'

app.configure('development', ->
  app.use(express.static(__dirname + '/public'))
  app.use(express.errorHandler({ dumpExceptions: true }))
)

app.configure('production', ->
  oneYear = 31557600000
  oneHour = 3600000
  app.use(express.static(__dirname + '/public', { maxAge: oneHour }))
)

# Build the extension matcher
re_str = config.extensions.join('|')
config.re = new RegExp(re_str)

fs_cache = {}

app.get '/', (req, res) ->
  res.redirect '/index.html'

app.get '/clear_cache', ->
  fs_cache = {}

app.get '/media/', (req, res) ->
  file_info = []
  for media in config.media
    file_info.push({name: media.name, directory: true})

  res.send({files: file_info})

app.get '/media/:id/*', (req, res) ->
  id   = req.params.id
  path = req.params[0]

  # Check the fs cache
  cache_key = id + ',' + path
  current_date = new Date()
  if fs_cache[cache_key] and
     (current_date - fs_cache[cache_key].updated < config.fs_cache_time)
    return res.send({files: fs_cache[cache_key].file_info})

  for media in config.media
    if media.name is id
      media_path = media.path.replace(/\/$/, '')

  return res.send('Media path not found', 500) unless media_path?

  path = if path? then decodeURI(media_path) + '/' + path else media_path

  # Wait for all stats to complete
  waiting  = 0
  complete = (file_info) ->
    waiting--
    unless waiting
      fs_cache[cache_key] = {updated: current_date, file_info: file_info}
      return res.send({files: file_info})

  supported_files = (files) ->
    for file in files
      return true if config.re.test(file)

    false


  fs.readdir(path, (err, files) ->
    file_info = []

    return res.send("Media path read failed", 500) if err?
    unless files && files.length > 0
      return res.send({files: []})

    for file in files
      continue unless /^\w/.test(file)

      waiting++

      do ->
        this_file = file
        fs.stat(path + '/' + this_file, (err, stat) ->
          if err
            file_info.push({name: this_file, error: err})
            complete(file_info)
          else if stat.isFile() #|| stat.isDirectory()
            file_info.push({name: this_file, directory: stat.isDirectory()})
            complete(file_info)
          else if stat.isDirectory()
            fs.readdir(path + this_file, (err, files) ->
#              if supported_files(files)
              file_info.push({name: this_file, directory: stat.isDirectory()})

              complete(file_info)

            )
        )
  )


app.get '/stream/:id/*', (req, res) ->
  id   = req.params.id
  path = req.params[0]

  for media in config.media
    media_path = media.path if id is media.name

  return res.send('Not Found', 404) unless media_path?

  if /(?:mp4|m4v)$/i.test(path)
    content_type = 'video/mp4'
  else if /(?:webm)$/i.test(path)
    content_type = 'video/webm'
  else if /(?:ogg|ogv)$/i.test(path)
    content_type = 'video/ogg'
  else
    return res.send('Bad Request', 400)

  path = decodeURI(media_path) + '/' + decodeURI(path)

  fs.stat(path, (err, stat) ->
    return res.send('Not Found', 404) if err

    range = req.headers.range
    unless range?
      return res.sendfile(path)

    return res.send('Bad Request', 400) unless range?

    [range_start, range_end] = range.replace(/bytes=/, "").split("-")

    total_bytes = stat.size - 1
    start       = if range_start then parseInt(range_start, 10) else 0
    end         = if range_end then parseInt(range_end, 10) else total_bytes
    block_size  = (end - start) + 1

    res.header('Content-Range', "bytes " + start + '-' + end + '/' + total_bytes)
    res.header('Content-Length', block_size)
    res.header('Content-Type', content_type)
    res.header('Accept-Ranges', 'bytes')
    res.statusCode = 206

    res.sendfile(path, {bufferSize: 8192, start: start, end: end})
  )

unless module.parent
  app.listen(port)
  console.log('Express server listening on port %d, environment: %s', port, app.settings.env)

