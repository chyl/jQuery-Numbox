(function($) {
      $.fn.numbox = function(config)
      {
          // default config
          var def=
          {
              increment: 1,          // increment value
              separator: ",",        // separator if decimals>0
              max_value: null,       // maximal field value or null (0 means zero)
              min_value: 0,          // minimal field value or null (0 means zero)
              integers: 2,           // how many integer digits, minimum 1
              decimals: 0,           // how many digits after zero (0 means any)
              restrict: false,       // only start+n*increment values? n=...,-2,-1,0,1,2,... ?
              zero_fill_right: true, // 1,000?
              zero_fill_left: false, // 000,1?
              use_wheel: true,       // handle mouse wheel ?
              use_label: true,       // handle label dragging ?
              accleration: true,     // use acceleration when button pressed?
              change:null,           // change event handler
              costum_class: "numbox",// name of calss
              button_text: ["+", "-"]// buttons labels [inc, dec] or null
          }
          $.extend(def, config);
          
          // some value check
          if(typeof(def.integers)=="number" && def.integers>12)
          {
              def.integers=12;
          }
          else if(def.integers<1)
          {
              def.integers=1;
          }
          var dec_str = decimal_to_str(def.increment);
          if(dec_str!="0" && dec_str.length>def.decimals)
          {
              def.decimals=dec_str.length;
          }
          
          if(typeof(def.decimals)!="number")
          {
              def.decimals=0;
          }
          else if(def.decimals>6)
          {
              def.decimals=6;
          }
          // przedzial
          var max_range = 10000; //Math.pow(10,def.integers)-1+(Math.pow(10,def.decimals)-1)/Math.pow(10,def.decimals);
          if(typeof(def.max_value)!="number" || def.max_value>max_range)
          {
                def.max_value=max_range;
          }
          
          if(typeof(def.min_value)!="number" || def.min_value<-max_range)
          {
                def.min_value=-max_range;
          }
          if(def.min_value>=def.max_value)
          {
              def.max_value =  max_range;
              def.min_value = -max_range;
          }
          if(!(def.button_text instanceof Array) || def.button_text.length<2)
          {
              def.button_text = ["", ""];
          }

          // some global vars
          var reg_separator = (def.separator=="." ? "\\." : def.separator);
          var s = "(\\-?\\d";
              s+= def.zero_fill_left ? "{"+def.integers+"}" : "{1,"+def.integers+"}"; // ^\\d{n} lub ^\\d{1,n}
              s+= ")";
              s+= def.zero_fill_right&&def.decimals>0 ? "(,\\d{"+def.decimals+"})" :
                  (def.decimals==0 ? "" : "("+reg_separator+"\\d{1,"+def.decimals+"})?"); // "" lub \\d{n} lub \\d{1,n}
              s+= "";
          var r = "^"+s+"$";
          
          var reg_light = new RegExp("^(\\-?\\d+("+reg_separator+"\\d+)?)$");
          var reg_part = new RegExp(s);
          var reg = new RegExp(r);
          
          var body_el = $("body");

          // utilities
          function extract(v) // str->int
          {
              var val = v.split(def.separator);
              var ret;
              var sign = 1;
              if(val[0].substring(0,1)=="-")
              {
                 val[0] = val[0].substring(1);
                 sign = -1;
              }
              if(val[0]!=0)
                  val[0]=val[0].replace(/^0+/, "");
              if(val.length>1)
              {
                    digits_num = new String(val[1]).length;
                    ret = parseInt(val[0])+val[1]*Math.pow(10, -digits_num);
                    
              }
              else
              {
                ret = parseInt(val[0]);
              }
              return sign*roundTo(ret, def.decimals);
          }
          
          function roundTo(num, dec)
          {
              return Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
          }

          function round_to_inc(a, start_value, el)
          {
             if(isNaN((new Number(el.start_value))))
             {
                 start_value = 0;
             } else {
                 start_value = new Number(el.start_value);
             }
             
             var abs = Math.abs(a-el.start_value);
             var mod = roundTo(abs%def.increment, def.decimals);

             if(mod!=0 && mod!=def.increment)
             {         // ^^^^^^^^^^^^^^^^^^ fucking floats in js
               abs = mod<def.increment/2 ? abs - mod : abs - mod + def.increment;
               a = start_value + (a<start_value ? -1 : 1) * abs;
               if(a<def.min_value)
                    a+=def.increment;
               else if(a>def.max_value)
                    a-=def.increment;
             }
             return a;
          }
          function decimal_to_str(v){ // flaot -> str
              var val = new String(v).split(".");
              if(val.length>1)
              {
                  return new String(val[1]);
              }
              return "0";
          }
          function clean(v)
          {
              var a = v.substring(0,1)=="-" ? v.substring(1) : v;
              v = (a.length==v.length ? "" : "-") +
                   a.replace(new RegExp("[^\\d"+(def.decimals>0 ? def.separator : "")+"]+"), "");
              v = v.split(def.separator);
              if(v[0]=="" && v.length>1)
                  v[0]="0";
              else if(v[0]=="-" && v.length>1)
                  v[0]="-0";
              return (v.length>1) ? v[0]+def.separator+v[1] : v[0];
          }
          function valid(str)
          {
            return reg_light.test(str);
          }

          function make_format(n) // int->str
          {
              var sign = n<0 ? "-" : "";
              n = Math.abs(n);
              var dec = decimal_to_str(n);
              var ints = new String(Math.floor(n));
              if(def.zero_fill_left) // usun zera z calkowitej
              {
                while(ints.length<def.integers)
                {
                    ints = '0'+ints;
                }
              }
              else
              {
                  if(ints!=0)
                  {
                    ints=ints.replace(/^0+/, "");
                  }
              }

              if(def.zero_fill_right && def.decimals>0)
              {
                while(dec.length<def.decimals)
                {
                    dec = dec+'0';
                }
                return sign + ints + def.separator + dec;
              }
              return new String(sign + ints + (dec!=0 ? def.separator+dec : ''));
          }
          
          
          function modify(n, delta, el)
          {
            var value = extract($(el).val());
            var value_tmp = value;
            var increment = def.increment*delta;
            
            while(n>0)
            {
                if(value+increment<def.min_value || value+increment>def.max_value)
                {
                    if(!def.restrict)
                    {
                        value = delta<0 ? def.min_value : def.max_value;
                    }
                    break;
                }
                value += increment;
                n--;
            }
            if(value_tmp==value)
            {
                return false;
            }
            if(value+increment<def.min_value)
            {
                if(def.restrict)
                    el.min_value_setted = true;
                else if(value<=def.min_value)
                     el.min_value_setted = true;
            }
            else if(value+increment>def.max_value)
            {
                if(def.restrict)
                    el.max_value_setted = true;
                else if(value>=def.max_value)
                    el.max_value_setted = true;
            }
            delta<0 ? el.max_value_setted = false : el.min_value_setted = false;
            set_number(value, el);
            return true;

          }

          function set_number(new_value, el)
          {
             new_value = roundTo(new_value, def.decimals);
             var old_tmp = el.old_value;

             $(el).val(make_format(new_value));

             el.button_up[el.max_value_setted ? "addClass" : "removeClass"]("up_disabled");
             el.button_down[el.min_value_setted ? "addClass" : "removeClass"]("down_disabled");

             if(el.old_value!=new_value)
             {
                
                el.old_value=new_value;
                if(old_tmp!=null)
                {
                    if(typeof(def.change)=="function")
                    {
                        def.change.call(el, new_value, old_tmp);
                    }
                }
                
             }
          }

          function register_button_timer(e)
          {
              var fn = e.data.fn;
              var el = e.data.el;
              
              if(el.timer_button)
                      clearInterval(el.timer_button);
              el.button_iter = 0;

              if(el.timer_delay)
                clearTimeout(el.timer_delay);

              el.timer_delay = setTimeout(function(){
                el.timer_button = setInterval(function(){
                    button_time_handler(fn, el);
                }, 80);
              }, 200, fn);

              body_el.one("mouseup", {fn: fn}, function(e){
                  if(el.timer_delay)
                    clearTimeout(el.timer_delay);
                  if(el.timer_button)
                  {
                      clearInterval(el.timer_button);
                  }
                e.stopPropagation();
              });
          }
          function button_time_handler(fn, el)
          {
            var speed = 1;
            
            if(def.accleration)
            {
                speed = el.button_iter++>10 ?
                    (el.button_iter>20 ?
                        (el.button_iter>40 ?
                            (el.button_iter>80 ? 16:8)
                         :4)
                     :2)
                : 1;
            }
            fn(speed);
          }

          function slide_handler(e)
          {
              // trzeba to ladniej napisac
              var el = e.data.el;
              var delta = el.x_pos-e.pageX;
              delta<0 ? el.inc() : el.dec();
              el.x_pos = e.pageX;
          }


          function parse_field(el)
          {

             
              var t= $(el);
              var a = t.val();
              var b;
              
              if(!valid(a)) //jezeli numer nie przeszedl parsowania....
              {
                  t.val(clean(a)); // usu� wszytko co nieymagane w stringu
                  if(t.val()=="") //jesli liczba nie nadaje sie do niczego....
                  {
                    t.val("0"); // ustaw zero
                  }
              }
              
              a = t.val().match(reg_light);
              b = a!=null ? a[0] : t.val();
              a = extract(b);
            
             // sprawdz czy nie przekroczono zakresu
             
             el.min_value_setted = el.max_value_setted = false;
             if(a<=def.min_value || a>=def.max_value)
             {
                if(a<=def.min_value)
                {
                    a = def.min_value;
                    el.min_value_setted = true;
                }
                else
                {
                    a = def.max_value;
                    el.max_value_setted = true;
                }
             }

             if(el.start_value==null)
             {
               el.start_value = a;
             }
             
             // sprawdz czu nie rzba zaokraglic do wpolczynika wzrostu
             if(def.restrict)
                a = round_to_inc(a, el.start_value, el);

             set_number(a, el);
          }

          function mousewheel_handler(event)
          {
              var delta = 0;
              event = $.event.fix(event || window.event);
              event.type = "mousewheel";
              
              if ( event.wheelDelta ) delta = event.wheelDelta/120;
              if ( event.detail     ) delta = -event.detail/3;
              
              var target = $(event.target);
              var tag_name = target.attr("tagName").toLowerCase();
              
              if(tag_name=="input" && target.attr("type")=="button")
              {
                  target = target.parent().parent().find("input");
              }
              else if(tag_name=="label")
              {
                  var target2 = $("#"+target.attr("for"));
                  if(target.length>0)
                      target=target2;
              }
              target=target[0];
              target.focus();
              delta>0 ? target.inc() : target.dec();
              event.preventDefault();
              event.stopPropagation();
              return false;
          }

          function register_mouse_wheel(fn, el)
          {
              
              if(el[0].addEventListener)
              {
                  el[0].addEventListener('DOMMouseScroll', fn, false);
                  el[0].addEventListener('mousewheel', fn, false);
              }
              else
              {
                  el[0].onmousewheel = fn; //ie....
              }
          }

          function getSelectionStart(o) {
                    if (o.createTextRange)
                    {
                            var r = document.selection.createRange().duplicate();
                            r.moveEnd('character', o.value.length);
                            if (r.text == '')
                                return o.value.length;
                            return o.value.lastIndexOf(r.text);
                    }
                    else
                    {
                        return o.selectionStart
                    }
            }

            function getSelectionEnd(o) {
                    if (o.createTextRange)
                    {
                            var r = document.selection.createRange().duplicate();
                            r.moveStart('character', -o.value.length);
                            return r.text.length;
                    }
                    else
                    {
                        return o.selectionEnd;
                    }
            }


            function keypress_handler(e)
            {
                
                    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
                    var start_pos = getSelectionStart(this);
                    var end_pos = getSelectionEnd(this);
                    
                    // ctrl + ...
                    if(e.ctrlKey)
                    {
                        switch(key)
                        {
                            case 97: //a
                            case 65:
                            case 120://x
                            case 88:
                            case 99: //c
                            case 67:
                            case 122://z
                            case 90:
                            case 118://v
                            case 86:
                                return true;
                        }
                    }
                    // if not number
                    if(key < 48 || key > 57)
                    {
                        switch(key)
                        {
                            case 45: // "-" only on start
                                if(def.min_value>=0)
                                    return false;
                                if(this.value.lastIndexOf("-")<1)// can be on start or can be selected
                                {
                                    if(start_pos==0)
                                    {
                                        if(start_pos<end_pos && this.value.indexOf("-")==0)//range
                                            return true;
                                        else if(this.value.indexOf("-")==-1)
                                            return true;
                                    }
                                }

                            break;

                            case def.separator.charCodeAt(0)://separator
                                if(this.value.indexOf(def.separator)<0)
                                    return true;
                                if(start_pos<end_pos)
                                {
                                   var range = this.value.substring(start_pos, end_pos);
                                   if(range.indexOf(def.separator)>-1)
                                       return true;
                                }
                            break;
                            // some contorls

                            case 45:
                                if(e.shiftKey) // shift + ins
                                    return true;
                            break;

                            case 8:
                            case 9:
                            case 13:
                            case 35:
                            case 36:
                            case 37:
                            case 39:
                            case 38: //up
                            case 40: //down
                            case 46:
                              return true;
                            break;

                            default:
                                if(typeof e.charCode != "undefined" && $.browser.msie)
                                {
                                    if(e.keyCode == e.which && e.which != 0){
                                            return true;
                                    }
                                    else if(e.keyCode != 0 && e.charCode == 0 && e.which == 0)
                                            return true;
                                }
                        }
                        return false;
                    }
                    return true;
              }
              
              function keydown_handler(e)
              {
                  var target = (typeof(e.data)!="undefined") ? e.data.el : e.target;
                  if(e.keyCode==38)
                     target.inc();
                  else if(e.keyCode==40) // down arrow
                     target.dec();
              }

          /**
           *  Prepare colection
           */
          
          this.each(function()
          {
              // do not modify this DOM!
              var this_ref = this;
              var t = $(this).addClass("field");
              var wrapper = $("<span>").addClass(def.costum_class);
              var button_wrapper = $("<span>").addClass("buttons");
              var clear = $("<span>").addClass("clear");
              var button_up = $("<input/>").attr("type", "button").addClass("up");
              var button_down = $("<input/>").attr("type", "button").addClass("down");
              var label = $("label[for='"+t.attr('id')+"']");
              var ie_check = null;

              // EXTRA PARAMS
              $.extend(this,
              {
                  timer: null,
                  timer_button: null,
                  timer_delay: null,
                  old_value: null,
                  start_value: null,
                  x_pos:0,
                  x_iter:0,
                  button_iter:0,
                  max_value_setted: false,
                  min_value_setted: false,
                  button_up: button_up,
                  button_down: button_down
              });

              function inc(n) // a=a+n*inc
              {
                if(typeof(n)!="number")
                {
                    n=1;
                }
                modify(n, 1, this_ref);
              }
              
              function dec(n) // a=a-n*inc
              {
                if(typeof(n)!="number")
                {
                    n=1;
                }
                modify(n, -1, this_ref);
              }

              function get_number()
              {
                  return extract(t.val());
              }

              function check_filed()
              {
                  var v = t.val();
                  var c = "";
                  if(!valid(v))
                  {
                   c = clean(v);
                   if(c!=v)//for ie...
                       t.val(c);
                  }
                   
              }

              function set_number_sec(n)
              {
                  set_number(n, this_ref);
              }
              

              /***
               * Setup
               */

              t.focus(function(){
                this_ref.timer = setInterval(check_filed, 50);
              });
              t.blur(function(){
                  this_ref.timer = null;
                  parse_field(this_ref);
              });
              
              t.keypress(keypress_handler);
              t.keydown(keydown_handler);
              
              t.attr("maxlength",
               (def.min_value<0 ? 1 : 0)+
                def.integers +
               (def.decimals>0 ? def.decimals+1 : 0)
              );

              if(label.length && def.use_label){
                 label.css("cursor", "e-resize");
                 label.mousedown(function(e){
                      this_ref.x_pos = e.pageX;
                      this_ref.x_iter = 0;
                      body_el.bind('mousemove', {el: this_ref}, slide_handler);
                      $("body, input").css("cursor", "e-resize");
                      body_el.one('mouseup', function()
                      {
                          body_el.unbind('mousemove', slide_handler);
                          $("body, input").css("cursor", "auto");
                      });
                  });
                  // label text selecting
                  slide_el = label[0];
                  if (typeof slide_el.onselectstart!="undefined")
                        slide_el.onselectstart=function(){return false}
                  else if (typeof slide_el.style.MozUserSelect!="undefined")
                        slide_el.style.MozUserSelect="none"
                  else
                        slide_el.onmousedown=function(){return false}
              }
              
              // wheel
              if(def.use_wheel)
              {
                $.each([button_down, button_up, t], function(){
                    register_mouse_wheel(mousewheel_handler, this);
                });
                if(label.length)
                    register_mouse_wheel(mousewheel_handler, label);
              }

              // buttons
              button_up.add(button_down).focus(function(){
                  //$(this).blur()
              });
              button_up.bind("mousedown", {fn: inc, el: this_ref}, register_button_timer).click(function(){inc();}).bind('keydown', {el: this_ref}, keydown_handler);
              button_down.bind("mousedown", {fn: dec, el: this_ref}, register_button_timer).click(function(){dec();}).bind('keydown', {el: this_ref}, keydown_handler);

              // render
              if(t.attr("id"))
              {
                  wrapper.attr("id", "numbox_of_"+t.attr("id"));
              }
              if(def.button_text[0]!="")
              {
                  button_up.val(def.button_text[0]);
              }
              if(def.button_text[1]!="")
              {
                  button_down.val(def.button_text[1]);
              }
              t.wrap(wrapper);
              t.after(
                button_wrapper.
                    append(button_up).
                    append(button_down).
                after(clear)
              );

              this.inc = inc;
              this.dec = dec;
              this.get_number = get_number;
              this.set_number = set_number_sec;

              parse_field(this);
              
          });
          /**
           * interface
           */
          this.inc = function(n)
          {
            for(var i=0; i<this.length; i++)
            {
                this[i].inc(n);
            }
            return this;
          }

          this.dec = function(n)
          {
            for(var i=0; i<this.length; i++)
            {
                this[i].inc(n);
            }
            return this;
          }
          
          this.set_number = function(n)
          {
            for(var i=0; i<this.length; i++)
            {
                this[i].set_number(n);
            }
            return this;
          }

          this.get_number = function()
          {
            if(this.length)
                return this[0].get_number();
            return null;
          }
          return this;
      }
  })(jQuery);