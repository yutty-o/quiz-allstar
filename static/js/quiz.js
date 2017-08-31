$(function() {
  // 高さ指定
  const wh = $(window).outerHeight();
  $('body').css({ height: wh });
  // コントローラセット
  setupControllers();
  setupPages();
  Q.page.gotoFirst();
});

var Q = {
  util: {},
  period: {},
  page: {},
  bgm: {},
  movie: {},
  quiz: {
    START_COUNT: 10
  },
  answer: {
    ANSWER_DELAY: 1500 // msec
  },
  loser: {
    DELAY_DELTA: 300, // msec
    LAST_DELAY: 900,
    MAX_LOSERS: 10 // 表示する人数の最大数
  },
  winner: {
    DELAY_DELTA: 300, // msec
    LAST_DELAY: 1500,
    MAX_WINNERS: 10 // 表示する人数の最大数
  }
};


function setupControllers() {
  $('#controllers #next').click(Q.page.next);
  $('#controllers #rebirth').click(Q.period.rebirth);
  $('#init_period').click(Q.period.init);
}

function setupPages() {
  $('.page').on('show:page', function() {
    $('.wrap').removeClass('overlay_loser')
    Q.bgm.stopAll();
    Q.bgm.play();
  });
  $('.page.movie').on('show:page', Q.movie.play);

  $('.page.ready-quiz').on('show:page', Q.quiz.ready);

  $('.page.quiz').on('show:page', Q.quiz.show);
  $('.page.answers').on('show:page', Q.answer.show);
  $('.page.losers').on('show:page', Q.loser.show);
  $('.page.winners').on('show:page', Q.winner.show);
}



/*
 * Util
 */
Q.util.post = function(url, dataObj) {
  var data = dataObj;
  if (!data) {
    data = {};
  }

  var settings = {
    "async": true,
    "crossDomain": false,
    "url": url,
    "method": "POST",
    "headers": {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-cache"
    },
    "contentType": "application/json; charset=utf-8",
    "dataType": "json",
    "processData": false,
    "data": JSON.stringify(data)
  };

  return $.ajax(settings);
};



/*
 * Period
 */
Q.period.init = function() {
  $.get("/bridge/init");
};

Q.period.rebirth = function() {
  $.get("/bridge/rebirth");
};



/*
 * Page
 */
Q.page.goto = function(pageDom) {
  $('.page').removeClass('visible');
  pageDom.addClass('visible');
  pageDom.trigger('show:page');
};

Q.page.current = function() {
  return $('.page.visible');
};

Q.page.next = function() {
  Q.page.goto(Q.page.current().next());
};

Q.page.disableNext = function() {
  $('#next').attr('disabled', 'diabled');
};

Q.page.enableNext = function() {
  $('#next').removeAttr('disabled');
};

Q.page.prev = function() {
  Q.page.goto(Q.page.current().prev());
};

Q.page.gotoFirst = function() {
  Q.page.goto($('.page.first'));
};



/*
 * BGM
 */
Q.bgm.stopAll = function() {
  var bgms = $('audio');
  if (bgms) {
    for(var i=0; i<bgms.length; i++) {
      bgms[i].pause();
    }
  }
};

Q.bgm.play = function() {
  var bgms = $('audio', Q.page.current());
  if (bgms) {
    Q.bgm._playHeadAndTails(bgms);
  }
};

Q.bgm._playHeadAndTails = function(bgms) {
  if (0 < bgms.length) {
    var bgm = bgms[0];
    bgm.currentTime = 0;
    bgm.play();
    $(bgm).on('ended', function() {
      var delay = parseInt($(bgm).attr('data-after-delay') || '0');
      setTimeout(
        function() {
          Q.bgm._playHeadAndTails(bgms.slice(1));
        },
        delay
      );
    });
  }
};


/*
 * Movie
 */
Q.movie.play = function() {
  var videos = $('video', Q.page.current());
  if (videos) {
    for (var i=0; i<videos.length; i++) {
      videos[i].currentTime = 0;
      videos[i].play();
    }
  }
};


/*
 * Quiz
 */
Q.quiz.ready = function() {
  var page = Q.page.current();

  // ファイル名とページIndexからクイズIDを生成
  var match = location.pathname.match(/.+\/(.+)\.html/);
  var quiz_id = match[1] + '-' + page.index();

  // 正解番号は、現在ページの次の.answersページに定義
  var correct_num = $('.answer', page.nextAll('.answers')[0]).index();

  // 最後の問題か否か
  var is_special = page.index() == ($('.ready-quiz').length - 1);

  Q.util.post(
    "/bridge/ready",
    {
      quiz_id: quiz_id,
      correct_num: correct_num,
      is_special: is_special
    }
  );
};

Q.quiz.show = function() {
  // sned this answer is started to the server
  Q.util.post(
    "/bridge/answer/start",
    {
      timestamp: new Date().getTime()
    }
  );
  // play movies if exist
  Q.movie.play();
  // start count down
  Q.page.disableNext();
  var countdown = $('.countdown', Q.page.current());
  countdown.text(Q.quiz.START_COUNT);
  var id = setInterval(
    function() {
      var count = parseInt(countdown.text());
      if (0 < count) {
        countdown.text(count - 1);
      } else {
        Q.answer.load();
        clearInterval(id);
      }
    },
    1000
  );
};



/*
 * Answer
 */
Q.answer.load = function() {
  // diable the next button
  Q.page.disableNext();
  // reset answer info
  Q.answer.info = {};
  // load answer counts & (losers or winners)
  
  // mock
  Q.answer.info = {
      counts_of_answers: [10, 20, 30, 40],
      losers_or_winners: [
        {
          name: "ゆうと",
          time: 1.89
        },
        {
          name: "そうご",
          time: 2.21
        },
        {
          name: "なかむら",
          time: 3.12
        },
        {
          name: "荻野",
          time: 4.32
        },
        {
          name: "けいこ",
          time: 5.12
        },
        {
          name: "ゆってぃ",
          time: 6.22
        },
        {
          name: "しゅう",
          time: 9.12
        },
        {
          name: "8484",
          time: 8.12
        }
      ]
  };
  // enable the next button
  Q.page.enableNext();
  
  // $.getJSON(
  //   "/bridge/answer/check",
  //   function(json) {
  //     Q.answer.info = {
  //       counts_of_answers: json.answer_list,
  //       losers_or_winners: json.correct_list
  //     };
  //     // enable the next button
  //     Q.page.enableNext();
  //   }
  // );
};

Q.answer.loadCounts = function(callback) {
  return callback(Q.answer.info.counts_of_answers);
};

Q.answer.show = function() {
  Q.answer.loadCounts(function(answerCounts) {
    var currentPage = Q.page.current();
    var countBoxes = $('.count', currentPage);
    for (var i=0; i<countBoxes.length; i++) {
      $(countBoxes[i]).text(answerCounts[i]);
    }
    var answer = $('.answer', currentPage);
    answer.removeClass("animated flash");
    setTimeout(
      function() {
        answer.addClass("animated flash");
      },
      Q.answer.ANSWER_DELAY
    );
  });
};



/*
 * Loser
 */
Q.loser.load = function(callback) {
  return callback(Q.answer.info.losers_or_winners);
};

Q.loser.show = function() {
  $('.wrap').addClass('overlay_loser');
  Q.loser.load(function(losers) {
    var delay = 0;
    var container = $('.loser-list', Q.page.current());
    container.html('');
    for (var i=0; i<losers.length; i++) {
      delay += Q.loser.DELAY_DELTA;

      if (i == losers.length-1) {
        // last item
        Q.loser.appendLastLoserTo(
          losers[i],
          container,
          Q.loser.DELAY_DELTA * Q.loser.MAX_LOSERS + Q.loser.LAST_DELAY
        );
      } else {
        Q.loser.appendLoserTo(losers[i], container, delay);
      }
    }
  });
};

Q.loser.toHtml = function(loser) {
  return '<li class="animated flipInX">' + loser.name +
    '<span class="time">' + loser.time + ' sec</span></li>';
};

Q.loser.appendLoserTo = function(loser, losers, delay) {
  setTimeout(
    function() {
      losers.prepend(Q.loser.toHtml(loser));
    },
    delay
  );
};

Q.loser.appendLastLoserTo = function(loser, losers, delay) {
  setTimeout(
    function() {
      var dom = $(Q.loser.toHtml(loser));
      losers.prepend(dom);
      dom.one(
        'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
        function() {
          dom.addClass('flash');
          dom.removeClass('flipInX');
        }
      );
    },
    delay
  );
};



/*
 * Winer
 */
Q.winner.load = function(callback) {
  return callback(Q.answer.info.losers_or_winners);
};

Q.winner.show = function() {
  Q.winner.load(function(winners) {
    var delay = Q.winner.DELAY_DELTA * Q.winner.MAX_WINNERS + Q.winner.LAST_DELAY;
    var container = $('.winner-list', Q.page.current());
    container.html('');
    for (var i=0; i<winners.length; i++) {
      delay -= Q.winner.DELAY_DELTA;

      if (i == 0) {
        // last item
        Q.winner.appendFirstWinnerTo(winners[i], container, delay);
        delay -= Q.winner.LAST_DELAY;
      } else {
        Q.winner.appendWinnerTo(winners[i], container, delay);
      }
    }
  });
};

Q.winner.toDom = function(winner) {
  return $(
    '<li>' + winner.name +
      '<span class="time">' + winner.time + ' sec</span></li>'
  );
};

Q.winner.appendWinnerTo = function(winner, winners, delay) {
  var dom = Q.winner.toDom(winner);
  dom.css('visibility', 'hidden');
  winners.prepend(dom);
  setTimeout(
    function() {
      dom.css('visibility', 'visible');
      dom.addClass('animated flipInX');
    },
    delay
  );
};

Q.winner.appendFirstWinnerTo = function(winner, winners, delay) {
  var dom = Q.winner.toDom(winner);
  dom.css('visibility', 'hidden');
  winners.prepend(dom);
  setTimeout(
    function() {
      dom.css('visibility', 'visible');
      dom.addClass('animated flipInX');
      dom.one(
        'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend',
        function() {
          dom.addClass('flash');
          dom.removeClass('flipInX');
        }
      );
    },
    delay
  );
};
