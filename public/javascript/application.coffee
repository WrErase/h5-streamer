MEDIA_ROOT  = '/media'
STREAM_ROOT = '/stream'

show_loading = ->
  loading = $('#loading')

  loading_top  = '40'
  loading_left = '50'
  loading.css('top', loading_top  + 'px')
  loading.css('left', loading_left  + 'px')

  loading.show()

hide_loading = ->
  $('#loading').hide()


class Video extends Backbone.Model
  start_time: 0.1
  video_time: 0.1   # iOS 0.1
  seek_start: false
  loaded: false

  initialize: ->
    @bind('change:width', =>
      @get('video_el').width = @get('width')
    )

    @bind('change:height', =>
      @get('video_el').height = @get('height')
    )

    @bind('change:file_name', =>
      @set({video_time: 0.1})
      @set({start_time: 0.1})
      if Modernizr.localstorage
        localStorage['video_name'] = @get('file_name')
    )

    @bind('change:file_path', =>
      @set({video_time: 0.1})
      if Modernizr.localstorage
        localStorage['video_path'] = @get('file_path')
    )

    @bind('change:video_time', =>
      video_time = @get('video_time')
      if typeof video_time isnt 'number'
        video_time = parseFloat(video_time)

      # iOS
      video_time.toFixed(1)
      video_time = 0.1 if video_time < 0.1

      @set({video_time: video_time}, {silent: true})
      if Modernizr.localstorage
        localStorage['video_time'] = video_time
    )

    @get_last_video() unless @get('file_name')

  fetch: =>
    @get('video_el').load()

  play: =>
    @get('video_el').play()

  current_time: =>
    @get('video_el').currentTime

  duration: =>
    @get('video_el').duration

  seek: (time) =>
    try
      @get('video_el').currentTime = time
      @set({last_seek: time})
    catch error
      console.log(error)

  seek_last: =>
    video_time = @get('start_time')

    if video_time > 1
      @seek(video_time)

    @set({seek_start: true})

  get_last_video: =>
    if Modernizr.localstorage
      @set({file_name: localStorage['video_name']
            ,file_path: localStorage['video_path']
            ,start_time: localStorage['video_time']},
           {silent: true})


class VideoView extends Backbone.View
  model: Video

  events: ->

  initialize: ->
    @set_size()

    $('body').bind('orientationchange', (e) =>
      @set_size()
    )

    $('#skip_30').click( (e) =>
      e.preventDefault()
      $('#skip_30').addClass('button-clicked')

      current_time = @model.current_time()
      duration = @model.duration()

      if duration - current_time > 30
        @model.seek(current_time + 30)
      else if current_time > 0
        @model.seek(duration - 0.1)

      @model.play()

      setTimeout( ->
        $('#skip_30').removeClass('button-clicked')
      , 150
      )
    )

    $('#back_30').click( (e) =>
      e.preventDefault()
      $('#back_30').addClass('button-clicked')

      current_time = @model.current_time()
      if current_time > 30
        @model.seek(current_time - 30)
      else if current_time > 0
        @model.seek(0.1)

      @model.play()

      setTimeout( ->
        $('#back_30').removeClass('button-clicked')
      , 150
      )
    )

    $(@el).bind('loadstart', (e) =>
      hide_loading()

      @model.set({loaded: false})
    )

    $(@el).bind('timeupdate', (e) =>
      currentTime = e.currentTarget.currentTime
      if @model.get('seek_start')
        @model.set({video_time: currentTime})
      else
        @try_seek()
    )

    $(@el).bind('canplay', (e) =>
      hide_loading()

      @try_seek()
    )

    $(@el).bind('canplaythrough', (e) =>
      video_time = @model.get('video_time')

      @try_seek()
    )

    $(@el).bind('loadeddata', (e) =>
      hide_loading()
      @model.set({loaded: true})
    )

    $(@el).bind('error', (e) =>
      hide_loading()
      alert('Video load error!')
    )

    @bind('play', =>
      @source_video() unless @model.get('loaded')

      @model.play()
    )

    @render(false) if @model.get('file_path')?

  set_size: =>
    view_width  = $(window).width()
    view_height = $(window).height()

    if view_width >= 1024
      $(@el).parent().width(720)
      $(@el).width(720)
      $(@el).height(480)
    else if view_width > 640
      $(@el).parent().width(600)
      $(@el).width(600)
      $(@el).height(400)
    else
      $(@el).parent().width(300)
      $(@el).width(300)
      $(@el).height(200)

  try_seek: =>
    return if @model.get('seek_start')

    seekable = $(@el).prop('seekable')
    if seekable? and seekable.length > 0
      @model.seek_last()

  render: (play) ->
    $('#video-name').html(@model.get('file_name'))

    source_tag = $('<source>')
                     .attr('src', @model.get('file_path'))

    # Not if Android < 2.3
    source_tag.attr('type', 'video/mp4')

    $(@el).empty().append(source_tag)

    @model.fetch()
    @model.play() if play


class File extends Backbone.Model


class Directory extends Backbone.Collection
  model: File

  urlRoot: MEDIA_ROOT
  currentPath: '/'

  initialize: ->
    @bind('reset', ->
      if Modernizr.localstorage
        localStorage['current_path'] = @currentPath
    )

    if Modernizr.localstorage
      @currentPath = localStorage['current_path'] || ''

    @fetch()

  comparator: (file) ->
    file.get('name')

  fetch: (path) ->
    @currentPath = path if path?

    url = @urlRoot + @currentPath
 
    $.getJSON(url)
    .done( (data, textStatus, xhr) =>
      files = []
      for f in data.files
        if not f.directory
          continue unless Modernizr.video.h264 and /\.(m4v|mp4)/.test(f.name)

        files.push( new @model({name: f.name, uri_name: encodeURI(f.name), directory: f.directory}))

      @reset(files)
    )
    .fail( (xhr, textStatus) =>
      if @currentPath isnt '/'
        @down_directory()
        @fetch()

      alert(textStatus + ': ' + xhr.responseText)
    )

  up_directory: (name) ->
    @currentPath += name + '/'

    true

  at_root: ->
    return true if @currentPath.split('/').length <= 2

    false

  down_directory: ->
    return false unless @currentPath?

    @currentPath = @currentPath.split('/').slice(0, -2).join('/') + '/'

    true


class FileView extends Backbone.View
  tagName: 'div'
  className: 'button'

  model: File

  template: $('#file-view-tmpl')

  render: ->
    content = @template.tmpl(@model.toJSON())
    if @model.get('directory')
      $(@el).addClass('directory')
    else
      $(@el).addClass('file')

    $(@el).data('id', @model.get('name'))

    $(@el).html(content)

    this


class DirectoryView extends Backbone.View
  events: ->
    "click .directory":   "open_dir"
    "click .file":        "play_file"
    "click .back":        "back_dir"

  initialize: ->
    @collection.bind('reset', @render)

  render: =>
    els = []
    @collection.each( (model) =>
      view = new FileView({ model: model })
      els.push(view.render().el)
    )

    $(@el).hide()

    hide_loading()
    $('.button').removeClass('button-clicked')

    # TBD - Use el
    $('div').remove('.file, .directory')

    if @collection.at_root()
      $('.back').hide()
    else
      $('.back').show()

    $(@el).append(els).show()

    this

  open_dir: (e) ->
    e.preventDefault()

    show_loading()

    $(e.currentTarget).addClass('button-clicked')

    @collection.up_directory($(e.currentTarget).data('id'))
    @collection.fetch()

  back_dir: (e) ->
    e.preventDefault()

    show_loading()

    $(e.currentTarget).addClass('button-clicked')

    if @collection.down_directory()
      @collection.fetch()
    else
      hide_loading()
      setTimeout( ->
        $('.button').removeClass('button-clicked')
      , 150
      )


  play_file: (e) ->
    e.preventDefault()

    show_loading()

    $('.file').removeClass('button-clicked')

    $(e.currentTarget).addClass('button-clicked')

    $("body").animate({ scrollTop: 0 }, 'fast', 'swing', =>
      file_name = $(e.currentTarget).data('id')
      file_path = STREAM_ROOT + @collection.currentPath +  file_name

      @video.set({file_name: file_name, file_path: file_path})
      @video_view.render(true)
    )


$ ->
  if not Modernizr.video
    alert("HTML5 Video Not Supported")

  else if not Modernizr.video.h264
    alert("Browser Does Not Support h.264 video")

  agent = navigator.userAgent.toLowerCase()

  video = new Video({video_el: $('#video').get(0)})
  video_view = new VideoView(model: video, el: $('#video'))

  dir = new Directory()
  dir_view = new DirectoryView({collection: dir, el: $('#file-list')})
  dir_view.video = video
  dir_view.video_view = video_view

