var JWebbChat = (function ($, Chat, PS) {
  'use strict';

  // Private Variables
  var STEP_NUM = 10,
  FETCH_DELAY = 3000,
  ITEM_DELIM = ': ',
  ITEM_SPEAKER = 'speaker',
  ITEM_SPEECH = 'speech',
  ITEM_UPDATED = 'updatedAt',
  LI_CLASS_ME = 'from-me',
  LI_CLASS_THEM = 'from-them',
  LI_CLASS_IT = 'from-it',
  RESULT_TYPE_STR = 'string',
  RESULT_TYPE_OBJ = 'object',
  ENTRIES_LIMIT = 10,
  UI_ROOT = '[data-behavior=client]',
  UI_STATUS = '[data-behavior=status]',
  UI_MESSAGES = '[data-behavior=messages]',
  UI_OPTIONS = '[data-behavior=options]',
  UI_INPUT = 'input[type=text]',
  UI_SUBMIT = 'button',
  KEY_ENTER = 13,
  CLASSNAME_CHATS = 'chats',
  USER_ROBOCHAT = 'RoboChat',
  UI_ON_CLASS = 'ui-on',

  _chatView = null,

  _intervalId = null,

  _updateNum = 0,

  _entries = [],

  _isChatRunning = false,

  _isResponseAnObject = null,

  _history = [],

  _resultType = null,

  _isViewingHistory = false;


  function _doUpdate () {
    _updateNum++;
    if (!PS.isOnline()) {
      _updateStatus('Connecting to Chatbuilder...');
      PS.init('chats');
    }
    if (_updateNum > 1) {
      _updateStatus('Requesting chat data...');
    }
    PS.fetch({order:'createdAt'}, _refreshChatView);
  }

  function _refreshChatView (data) {
    _parseResponse(data);
    _displayEntries();
    if (!_isViewingHistory) {
      _updateScrollPos();
    }
    _updateStatus('Last update: ' + new Date().toTimeString().substr(0, 8));
  }

  function _parseResponse (chatArray) {
    var chatLog;
    console.log(chatArray);

    // Replace existing entries with most recent chat entries
    if (!_isViewingHistory) {
      _entries.length = 0;
    }

    // During first portion of test, chatArray contains strings while it
    // contains objects during 2nd portion.  Handle result strings or objects
    // as appropriate.
    if ((chatArray instanceof Array) === false) {
      // Record history items and Parse entry object from result object
      _resultType = RESULT_TYPE_OBJ;
      chatLog = $.map(_history, function (obj, i) {
        return obj.objectId;
      });
      $.each(chatArray.results, function (i, item) {
        var itemIsUnique = false;
        if ($.inArray(item.objectId, chatLog) === -1) {
          _history.push(item);
          itemIsUnique = true;
        }
        if (_isViewingHistory && itemIsUnique) {
          _addEntry(i, item);
        }
        else if (!_isViewingHistory) {
          _addEntry(i, item);
        }
      });
    }
    else {
      // Parse entry object from result strings
      _resultType = RESULT_TYPE_STR;
      $.each(chatArray, _addEntry);
    }
  }

  function _addEntry (i, item) {
    var part, entry = {};
    part = (_resultType === RESULT_TYPE_OBJ) ? item.text.split(ITEM_DELIM) : item.split(ITEM_DELIM);
    entry[ITEM_SPEAKER] = part[0];
    entry[ITEM_SPEECH] = part[1];
    entry[ITEM_UPDATED] = new Date(item.updatedAt);
    _entries.push(entry);
  }

  function _displayEntries () {
    var list, html, latestEntries, liStyle, limit;
    if (_isChatRunning) {

      //
      limit = (_isViewingHistory) ? 0 : _entries.length - ENTRIES_LIMIT;
      latestEntries = _entries.slice(limit, _entries.length);
      html = $.map(latestEntries, function (entry, i) {

        // Set list item classname
        switch (entry[ITEM_SPEAKER]) {
          case USER_ROBOCHAT:
            liStyle = LI_CLASS_IT;
            break;

          case PS.getUsername():
            liStyle = LI_CLASS_ME;
            break;

          default:
            liStyle = LI_CLASS_THEM;
        }

        // Create span tags for list item content
        var speaker = '<span class="speaker">' + entry[ITEM_SPEAKER] + ITEM_DELIM +'</span>',
        speech = '<span class="speech">' + entry[ITEM_SPEECH] + '</span>',
        d = entry[ITEM_UPDATED],
        updatedAt = d.toDateString().slice(0, (d.toDateString().length - 5)) +', '+ d.toTimeString().slice(0, 8),
        note = '<span class="note">'+ updatedAt +'</span>';

        // Return finalized HTML string
        return '<li class="'+ liStyle +'">'+ speaker + speech + note + '</li>';
      }).join().replace(/,/g, '');

      list = _chatView.find('ul');
      list.children().remove();
      list.append(html);
    }
  }

  function _sendComment (event) {
    var input, comment, isReady = false;

    if (_isChatRunning) {

      input = _chatView.find(UI_INPUT);
      if (event.type === 'click' && input.val() !== '') {
        isReady = true;
      }
      else if (event.type === 'keypress' && (event.keyCode === KEY_ENTER) || (event.which === KEY_ENTER)) {
        isReady = true;
      }

      if (isReady) {
        comment = input.val();
        input.val('');
        console.log('Sending comment: "'+ comment + '"...');
        PS.send(comment);
      }
    }
  }

  function _updateStatus (message) {
    var status = _chatView.find(UI_STATUS);
    status.find('p').remove();
    status.append('<p>'+ message +'</p>');
  }

  function _updateScrollPos () {
      var msgList = $(UI_MESSAGES);
      msgList.prop('scrollTop', msgList.prop('scrollHeight'));
  }

  function _toggleCtrls (event) {
    var delay;
    console.log(event.type);
    if (event.type === 'mouseenter') {
      _chatView.addClass(UI_ON_CLASS);
      delay = 0;
    }
    else if (event.type === 'mouseleave') {
      _chatView.removeClass(UI_ON_CLASS);
      delay = 250;
    }
    window.setTimeout(_updateScrollPos, delay);
  }

  function _toggleHistoryMode (event) {
    event.preventDefault();
    _chatView.toggleClass('history');
    _isViewingHistory = (_chatView.hasClass('history')) ? true : false;

    if (_isViewingHistory) {
      _entries.length = 0;
      $(_history).each(_addEntry);
      _displayEntries();
      _chatView.find(UI_OPTIONS).find('i').removeClass('fa-history').addClass('fa-comments');
    }
    else {
      _chatView.find(UI_OPTIONS).find('i').removeClass('fa-comments').addClass('fa-history');
    }
  }

  // Public Methods
  return {

    init: function (isAutostart) {
      var app = this;

      $(document).ready(function () {
        _chatView = $(UI_ROOT);

        if (_chatView.length === 0) {
          throw new Error('Expecting DOM element with \'data-behavior="chatClient"\'');
        }
        else {
          _chatView.on('click', UI_SUBMIT, _sendComment);
          _chatView.on('keypress', UI_INPUT, _sendComment);
          _chatView.on('click', UI_OPTIONS + ' a', _toggleHistoryMode);
          _chatView.on('mouseenter', _toggleCtrls);
          _chatView.on('mouseleave', _toggleCtrls);
        }

        if (isAutostart) {
          app.start();
        }
      });
    },

    getClient: function () {
      return _chatView;
    },

    start: function () {
      var message = 'JWebbChat is online...\tExpecting output every '+ (FETCH_DELAY / 1000) +' seconds.';
      _intervalId = window.setInterval(_doUpdate, FETCH_DELAY);
      _chatView.find(UI_SUBMIT).prop('disabled', false);
      _chatView.find(UI_INPUT).focus();
      _isChatRunning = true;
      _updateStatus(message);
      return true;
    },

    stop: function () {
      window.clearInterval(_intervalId);
      _chatView.find(UI_SUBMIT).prop('disabled', true);
      _isChatRunning = false;

      console.log('JWebbChat is offline.');
      return true;
    },

    help: function (num) {
      if (num === undefined) {
        num = STEP_NUM;
      }
      console.log('-- Chatbuilder Guide, Step #'+ num +' --');
      Chat.guide(num);
    }
  };
}($, Chat, ParseService));