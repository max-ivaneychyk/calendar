
/// Utils
Node.prototype.addClass = function (_class) {
   this.classList.add(_class);
   return this;
};

Node.prototype.removeClass = function (_class) {
   this.classList.remove(_class);
   return this;
};

// TransitionEnd (по основным префиксам)
function getTransitionEventName() {
   var tNames = {
      'transition': 'transitionend',
      'MozTransition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd',
      'OTransition': 'oTransitionEnd otransitionend'
   }, result = false;

   for (var name in tNames) {
      if (document.body.style[name] !== undefined) {
         return result = tNames[name];
      }
   }
   return result;
}

function onceEvent(elem, event, handler) {
   elem.addEventListener(event, function onceTrigger(e) {
      handler && handler.call && handler(e);
      elem.removeEventListener(event, onceTrigger);
   })
}



function Calendar() {
   // Названия месяцев
   this.monthName = [
      'January', 'February',
      'March', 'April', 'May',
      'June', 'July', 'August',
      'September', 'October', 'November',
      'December'
   ];

   // templates
   this.templates = {
      day: [
         '<div class="{$data.dayClass}" data-time="{$data.time}">',
         '{$data.dayNum}',
         '</div>'
      ].join(''),

      headerCalendar: [
         // inner..
         '<div class="cal-nav-month">',
         '<h2>{$data.month} {$data.year}</h2>',
         '</div>'
      ].join(''),

      footerCalendar: [
         // inner..
         '<div class="cal-list-days">',
         '<div>MONDAY</div>',
         '<div>WEDNESDAY</div>',
         '<div>TUESDAY</div>',
         '<div>THURSDAY</div>',
         '<div>FRIDAY</div>',
         '<div>SATURDAY</div>',
         '<div>SUNDAY</div>',
         '</div>',
         '<div class="cal-days">',
         '{$data.days}',
         '</div>'
      ].join('')

   };

   this.transitionend = getTransitionEventName();

   // По умолчанию используется текущая дата
   this.day = new Date().getDate();
   this.month = parseInt(new Date().getMonth());
   this.year = new Date().getFullYear();
   // place for render
   this.wrap = document.getElementById('cal-wrap');

   this.btnPrev = document.getElementById('cal-nav-prev');
   this.btnNext = document.getElementById('cal-nav-next');
   var calendar = this;

   this.headers = [];
   this.footers = [];

   this.btnPrev.addEventListener('mousedown', function () {
      var month = calendar.month > 0 ? --calendar.month : (calendar.month = 11);
      var year = calendar.month > 0 ? calendar.year : --calendar.year;

      calendar.etatDown(month, year);
      calendar.unlock(true);
   });
   this.btnNext.addEventListener('mousedown', function () {
      var month = calendar.month < 11 ? ++calendar.month : (calendar.month = 0);
      var year = calendar.month < 11 ? calendar.year : ++calendar.year;

      calendar.etatUp(month, year);
      calendar.unlock(true);
   });

   calendar.render(this.month, this.year, function (ctx) {
      ctx.headers[0].addClass('rotate-normal');
      ctx.footers[0].addClass('rotate-normal');

      ctx.wrap.appendChild(ctx.headers[0]);
      ctx.wrap.appendChild(ctx.footers[0]);
   });
}

Calendar.prototype = {
   constructor: Calendar,
   // unlock
   unlock: function (flag) {
      flag && this.btnPrev.addClass('invisible') || this.btnPrev.removeClass('invisible');
      flag && this.btnNext.addClass('invisible') || this.btnNext.removeClass('invisible');
   },
   // render
   parser: function (template, data) {
      var self = this;
      self['$data'] = data || {};

      var htmlCode = template.replace(/\{[\w\d\$\.]*\}/gi, function (str) {
         var path = str.slice(1, str.length - 1).split('.'); // remove \{  and \} and create array
         return self._searchLatest(self, path);
      });
      return htmlCode
   },
   _searchLatest: function searchLatest(ctx, path) {
      ctx = ctx[path.shift()];
      if (path.length && ctx) {
         return searchLatest(ctx, path);
      } else return ctx;
   },
   getListDays: function (month, year) {
      //
      var countAllDays = 32 - new Date(year, month, 32).getDate();
      // Начальный день месяца
      var startDay = new Date(year, month, 1).getDay();
      --startDay < 0 && (startDay = 6);

      return {
         firstEmpty: startDay,
         fillOut: countAllDays,
         lastEmpty: 42 - startDay - countAllDays
      }
   },
   createHeader: function (month, year) {
      var template = this.templates.headerCalendar,
         nameMonth = this.monthName[month];

      var wrap = document.createElement('div').addClass("cal-header");
      wrap.setAttribute('data-month', nameMonth);
      wrap.innerHTML = this.parser(template, {'month': nameMonth, 'year': year});

      this.headers.push(wrap);

      return wrap;
   },
   createFooter: function (month, year) {
      var countDays = this.getListDays(month, year);
      var template = '';

      var prevMonthLastDay = 32 - new Date(year, month - 1, 32).getDate();
      while (countDays.firstEmpty--) {
         var tempOneDay = this.parser(this.templates.day, {
            dayClass: "cal-day no-active",
            'dayNum': prevMonthLastDay--,
            'time': ''
         });
         template = tempOneDay.concat(template);
      }

      for (var day = 1; day <= countDays.fillOut; day++) {
         template += this.parser(this.templates.day, {
            dayClass: "cal-day active",
            'dayNum': day,
            'time': year + '-' + (month+1) + '-' + day
         });
      }

      for ( day = 1; day <= countDays.lastEmpty; day++) {
         template += this.parser(this.templates.day, {dayClass: "cal-day no-active", 'dayNum': day, 'time': ''});
      }

      var wrap = document.createElement('div').addClass("cal-content");
      wrap.innerHTML = this.parser(this.templates.footerCalendar, {'days': template});

      this.footers.push(wrap);

      return wrap;
   },
   render: function (month, year, callback) {
      this.createHeader(month, year);
      this.createFooter(month, year);
      callback && callback.call && callback(this);
   },
   //переворот вниз
   etatDown: function (month, year) {
      var animation = function (ctx) {
         ctx.headers[0].addClass('animation-down');
         ctx.footers[1].addClass('rotate-down').addClass('invisible');

         setTimeout(function () {
            ctx.footers[1].addClass('animation-normal').removeClass('invisible');
         }, 0);

         onceEvent(ctx.headers[0], ctx.transitionend, function () {
            ctx.footers[1]
                .removeClass('animation-normal')
                .removeClass('rotate-down');

            ctx.clear(ctx)
         });

         ctx.wrap.insertBefore(ctx.headers[1], ctx.wrap.firstChild);
         ctx.wrap.appendChild(ctx.footers[1]);
      };
      this.render(month, year, animation );
   },
   // переворот вверх
   etatUp: function (month, year) {
      var animation = function (ctx) {
         ctx.footers[0].addClass('animation-up');
         ctx.headers[1].addClass('rotate-down').addClass('invisible');

         setTimeout(function () {
            ctx.headers[1].addClass('animation-full-up').removeClass('invisible');
         }, 0);

         onceEvent(ctx.footers[0], ctx.transitionend, function () {
            ctx.headers[1]
                .removeClass('animation-full-up')
                .removeClass('rotate-down');

            ctx.clear(ctx);
         });

         ctx.wrap.appendChild(ctx.headers[1]);
         ctx.wrap.insertBefore(ctx.footers[1], ctx.wrap.firstChild);
      };

      this.render(month, year, animation);
   },
   clear: function (ctx) {
      ctx.headers.shift().remove();
      ctx.footers.shift().remove();
      ctx.unlock(false);
   }
};

var cal = new Calendar();


function Task( calendar ) {
   var task = this;

   // task.banner = document.createElement('div');
   // task.banner.addClass('cal-banner');
   // calendar.appendChild( task.banner );

   task.data = {
      '2016': {
         '10': {
            '31': {
               '14:00': 'It is first note..'
            }
         }
      }
   };

   calendar.addEventListener('mousedown', function (e) {
      if( e.target && e.target.hasAttribute('data-time'))
         var time = e.target.getAttribute('data-time');
         time && task.openDay( time );
   });
}

Task.prototype = {
   constructor: Task,
   pull: function () {

   },
   push: function () {

   },
   openDay: function ( date ) {
      var notes = this.lookForNotes( this.data , date.split('-'));

      console.log(notes);
   },
   lookForNotes: function lookForNotes( findInObject, arrKeys ) {
      var key = arrKeys.shift();
      findInObject = findInObject[key];

      return   arrKeys.length &&
               findInObject &&
               typeof findInObject == "object" ? lookForNotes(findInObject, arrKeys) : findInObject ;
   }
};

var task = new Task( cal.wrap );
    task.pull();




