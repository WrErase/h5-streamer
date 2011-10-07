(function() {
  var Directory, DirectoryView, File, FileView, MEDIA_ROOT, STREAM_ROOT, Video, VideoView, hide_loading, show_loading;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  MEDIA_ROOT = '/media';
  STREAM_ROOT = '/stream';
  show_loading = function() {
    var loading, loading_left, loading_top;
    loading = $('#loading');
    loading_top = '40';
    loading_left = '50';
    loading.css('top', loading_top + 'px');
    loading.css('left', loading_left + 'px');
    return loading.show();
  };
  hide_loading = function() {
    return $('#loading').hide();
  };
  Video = (function() {
    __extends(Video, Backbone.Model);
    function Video() {
      this.get_last_video = __bind(this.get_last_video, this);
      this.seek_last = __bind(this.seek_last, this);
      this.seek = __bind(this.seek, this);
      this.duration = __bind(this.duration, this);
      this.current_time = __bind(this.current_time, this);
      this.play = __bind(this.play, this);
      this.fetch = __bind(this.fetch, this);
      Video.__super__.constructor.apply(this, arguments);
    }
    Video.prototype.start_time = 0.1;
    Video.prototype.video_time = 0.1;
    Video.prototype.seek_start = false;
    Video.prototype.loaded = false;
    Video.prototype.initialize = function() {
      this.bind('change:width', __bind(function() {
        return this.get('video_el').width = this.get('width');
      }, this));
      this.bind('change:height', __bind(function() {
        return this.get('video_el').height = this.get('height');
      }, this));
      this.bind('change:file_name', __bind(function() {
        this.set({
          video_time: 0.1
        });
        this.set({
          start_time: 0.1
        });
        if (Modernizr.localstorage) {
          return localStorage['video_name'] = this.get('file_name');
        }
      }, this));
      this.bind('change:file_path', __bind(function() {
        this.set({
          video_time: 0.1
        });
        if (Modernizr.localstorage) {
          return localStorage['video_path'] = this.get('file_path');
        }
      }, this));
      this.bind('change:video_time', __bind(function() {
        var video_time;
        video_time = this.get('video_time');
        if (typeof video_time !== 'number') {
          video_time = parseFloat(video_time);
        }
        video_time.toFixed(1);
        if (video_time < 0.1) {
          video_time = 0.1;
        }
        this.set({
          video_time: video_time
        }, {
          silent: true
        });
        if (Modernizr.localstorage) {
          return localStorage['video_time'] = video_time;
        }
      }, this));
      if (!this.get('file_name')) {
        return this.get_last_video();
      }
    };
    Video.prototype.fetch = function() {
      return this.get('video_el').load();
    };
    Video.prototype.play = function() {
      return this.get('video_el').play();
    };
    Video.prototype.current_time = function() {
      return this.get('video_el').currentTime;
    };
    Video.prototype.duration = function() {
      return this.get('video_el').duration;
    };
    Video.prototype.seek = function(time) {
      try {
        this.get('video_el').currentTime = time;
        return this.set({
          last_seek: time
        });
      } catch (error) {
        return console.log(error);
      }
    };
    Video.prototype.seek_last = function() {
      var video_time;
      video_time = this.get('start_time');
      if (video_time > 1) {
        this.seek(video_time);
      }
      return this.set({
        seek_start: true
      });
    };
    Video.prototype.get_last_video = function() {
      if (Modernizr.localstorage) {
        return this.set({
          file_name: localStorage['video_name'],
          file_path: localStorage['video_path'],
          start_time: localStorage['video_time']
        }, {
          silent: true
        });
      }
    };
    return Video;
  })();
  VideoView = (function() {
    __extends(VideoView, Backbone.View);
    function VideoView() {
      this.try_seek = __bind(this.try_seek, this);
      this.set_size = __bind(this.set_size, this);
      VideoView.__super__.constructor.apply(this, arguments);
    }
    VideoView.prototype.model = Video;
    VideoView.prototype.events = function() {};
    VideoView.prototype.initialize = function() {
      this.set_size();
      $('body').bind('orientationchange', __bind(function(e) {
        return this.set_size();
      }, this));
      $('#skip_30').click(__bind(function(e) {
        var current_time, duration;
        e.preventDefault();
        $('#skip_30').addClass('button-clicked');
        current_time = this.model.current_time();
        duration = this.model.duration();
        if (duration - current_time > 30) {
          this.model.seek(current_time + 30);
        } else if (current_time > 0) {
          this.model.seek(duration - 0.1);
        }
        this.model.play();
        return setTimeout(function() {
          return $('#skip_30').removeClass('button-clicked');
        }, 150);
      }, this));
      $('#back_30').click(__bind(function(e) {
        var current_time;
        e.preventDefault();
        $('#back_30').addClass('button-clicked');
        current_time = this.model.current_time();
        if (current_time > 30) {
          this.model.seek(current_time - 30);
        } else if (current_time > 0) {
          this.model.seek(0.1);
        }
        this.model.play();
        return setTimeout(function() {
          return $('#back_30').removeClass('button-clicked');
        }, 150);
      }, this));
      $(this.el).bind('loadstart', __bind(function(e) {
        hide_loading();
        return this.model.set({
          loaded: false
        });
      }, this));
      $(this.el).bind('timeupdate', __bind(function(e) {
        var currentTime;
        currentTime = e.currentTarget.currentTime;
        if (this.model.get('seek_start')) {
          return this.model.set({
            video_time: currentTime
          });
        } else {
          return this.try_seek();
        }
      }, this));
      $(this.el).bind('canplay', __bind(function(e) {
        hide_loading();
        return this.try_seek();
      }, this));
      $(this.el).bind('canplaythrough', __bind(function(e) {
        var video_time;
        video_time = this.model.get('video_time');
        return this.try_seek();
      }, this));
      $(this.el).bind('loadeddata', __bind(function(e) {
        hide_loading();
        return this.model.set({
          loaded: true
        });
      }, this));
      $(this.el).bind('error', __bind(function(e) {
        hide_loading();
        return alert('Video load error!');
      }, this));
      this.bind('play', __bind(function() {
        if (!this.model.get('loaded')) {
          this.source_video();
        }
        return this.model.play();
      }, this));
      if (this.model.get('file_path') != null) {
        return this.render(false);
      }
    };
    VideoView.prototype.set_size = function() {
      var view_height, view_width;
      view_width = $(window).width();
      view_height = $(window).height();
      if (view_width >= 1024) {
        $(this.el).parent().width(720);
        $(this.el).width(720);
        return $(this.el).height(480);
      } else if (view_width > 640) {
        $(this.el).parent().width(600);
        $(this.el).width(600);
        return $(this.el).height(400);
      } else {
        $(this.el).parent().width(300);
        $(this.el).width(300);
        return $(this.el).height(200);
      }
    };
    VideoView.prototype.try_seek = function() {
      var seekable;
      if (this.model.get('seek_start')) {
        return;
      }
      seekable = $(this.el).prop('seekable');
      if ((seekable != null) && seekable.length > 0) {
        return this.model.seek_last();
      }
    };
    VideoView.prototype.render = function(play) {
      var source_tag;
      $('#video-name').html(this.model.get('file_name'));
      source_tag = $('<source>').attr('src', this.model.get('file_path'));
      source_tag.attr('type', 'video/mp4');
      $(this.el).empty().append(source_tag);
      this.model.fetch();
      if (play) {
        return this.model.play();
      }
    };
    return VideoView;
  })();
  File = (function() {
    __extends(File, Backbone.Model);
    function File() {
      File.__super__.constructor.apply(this, arguments);
    }
    return File;
  })();
  Directory = (function() {
    __extends(Directory, Backbone.Collection);
    function Directory() {
      Directory.__super__.constructor.apply(this, arguments);
    }
    Directory.prototype.model = File;
    Directory.prototype.urlRoot = MEDIA_ROOT;
    Directory.prototype.currentPath = '/';
    Directory.prototype.initialize = function() {
      this.bind('reset', function() {
        if (Modernizr.localstorage) {
          return localStorage['current_path'] = this.currentPath;
        }
      });
      if (Modernizr.localstorage) {
        this.currentPath = localStorage['current_path'] || '';
      }
      return this.fetch();
    };
    Directory.prototype.comparator = function(file) {
      return file.get('name');
    };
    Directory.prototype.fetch = function(path) {
      var url;
      if (path != null) {
        this.currentPath = path;
      }
      url = this.urlRoot + this.currentPath;
      return $.getJSON(url).done(__bind(function(data, textStatus, xhr) {
        var f, files, _i, _len, _ref;
        files = [];
        _ref = data.files;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          if (!f.directory) {
            if (!(Modernizr.video.h264 && /\.(m4v|mp4)/.test(f.name))) {
              continue;
            }
          }
          files.push(new this.model({
            name: f.name,
            uri_name: encodeURI(f.name),
            directory: f.directory
          }));
        }
        return this.reset(files);
      }, this)).fail(__bind(function(xhr, textStatus) {
        if (this.currentPath !== '/') {
          this.down_directory();
          this.fetch();
        }
        return alert(textStatus + ': ' + xhr.responseText);
      }, this));
    };
    Directory.prototype.up_directory = function(name) {
      this.currentPath += name + '/';
      return true;
    };
    Directory.prototype.at_root = function() {
      if (this.currentPath.split('/').length <= 2) {
        return true;
      }
      return false;
    };
    Directory.prototype.down_directory = function() {
      if (this.currentPath == null) {
        return false;
      }
      this.currentPath = this.currentPath.split('/').slice(0, -2).join('/') + '/';
      return true;
    };
    return Directory;
  })();
  FileView = (function() {
    __extends(FileView, Backbone.View);
    function FileView() {
      FileView.__super__.constructor.apply(this, arguments);
    }
    FileView.prototype.tagName = 'div';
    FileView.prototype.className = 'button';
    FileView.prototype.model = File;
    FileView.prototype.template = $('#file-view-tmpl');
    FileView.prototype.render = function() {
      var content;
      content = this.template.tmpl(this.model.toJSON());
      if (this.model.get('directory')) {
        $(this.el).addClass('directory');
      } else {
        $(this.el).addClass('file');
      }
      $(this.el).data('id', this.model.get('name'));
      $(this.el).html(content);
      return this;
    };
    return FileView;
  })();
  DirectoryView = (function() {
    __extends(DirectoryView, Backbone.View);
    function DirectoryView() {
      this.render = __bind(this.render, this);
      DirectoryView.__super__.constructor.apply(this, arguments);
    }
    DirectoryView.prototype.events = function() {
      return {
        "click .directory": "open_dir",
        "click .file": "play_file",
        "click .back": "back_dir"
      };
    };
    DirectoryView.prototype.initialize = function() {
      return this.collection.bind('reset', this.render);
    };
    DirectoryView.prototype.render = function() {
      var els;
      els = [];
      this.collection.each(__bind(function(model) {
        var view;
        view = new FileView({
          model: model
        });
        return els.push(view.render().el);
      }, this));
      $(this.el).hide();
      hide_loading();
      $('.button').removeClass('button-clicked');
      $('div').remove('.file, .directory');
      if (this.collection.at_root()) {
        $('.back').hide();
      } else {
        $('.back').show();
      }
      $(this.el).append(els).show();
      return this;
    };
    DirectoryView.prototype.open_dir = function(e) {
      e.preventDefault();
      show_loading();
      $(e.currentTarget).addClass('button-clicked');
      this.collection.up_directory($(e.currentTarget).data('id'));
      return this.collection.fetch();
    };
    DirectoryView.prototype.back_dir = function(e) {
      e.preventDefault();
      show_loading();
      $(e.currentTarget).addClass('button-clicked');
      if (this.collection.down_directory()) {
        return this.collection.fetch();
      } else {
        hide_loading();
        return setTimeout(function() {
          return $('.button').removeClass('button-clicked');
        }, 150);
      }
    };
    DirectoryView.prototype.play_file = function(e) {
      e.preventDefault();
      show_loading();
      $('.file').removeClass('button-clicked');
      $(e.currentTarget).addClass('button-clicked');
      return $("body").animate({
        scrollTop: 0
      }, 'fast', 'swing', __bind(function() {
        var file_name, file_path;
        file_name = $(e.currentTarget).data('id');
        file_path = STREAM_ROOT + this.collection.currentPath + file_name;
        this.video.set({
          file_name: file_name,
          file_path: file_path
        });
        return this.video_view.render(true);
      }, this));
    };
    return DirectoryView;
  })();
  $(function() {
    var agent, dir, dir_view, video, video_view;
    if (!Modernizr.video) {
      alert("HTML5 Video Not Supported");
    } else if (!Modernizr.video.h264) {
      alert("Browser Does Not Support h.264 video");
    }
    agent = navigator.userAgent.toLowerCase();
    video = new Video({
      video_el: $('#video').get(0)
    });
    video_view = new VideoView({
      model: video,
      el: $('#video')
    });
    dir = new Directory();
    dir_view = new DirectoryView({
      collection: dir,
      el: $('#file-list')
    });
    dir_view.video = video;
    return dir_view.video_view = video_view;
  });
}).call(this);
