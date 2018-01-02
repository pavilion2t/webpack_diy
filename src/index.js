import 'jQuery'
import 'bootstrap/dist/css/bootstrap.min.css'
import './css/common.css'
import img from './img/top_left.png'
import moment from 'moment'
window.moment = moment

$(function() {
  var control = new Controller()
})

function Controller() {
  this.requestTimer = null
  this.renderTimer = null
  this.allData = []
  this.afterFilterData = []
  this.lunchData = []
  this.dinnerData = []
  this.modifierSet = null
  this.isLunch = 0
  this.requestUrl = "https://bindo.com/api/v4/stores/26100/"
  this.date = ""
  this.newDate = null
  this.hanleRequestAllData()
}

Controller.prototype.hanleRequestAllData = function() {
  var self = this
  clearInterval(this.requestTimer)
  this.requestTimer = setInterval(function() {
    self.hanleRequestAllData()
  }, 2 * 60 * 1000);

  $.get(this.requestUrl + "favorite_tabs?with_details=true&per_page=999", {}, function(res) {
    var favorite_tab = [],
      week = new Date().getDay(),
      week = week + 1 + '';

    self.allData = []
    res.forEach(function(item) {
      item.favorite_tab.available_days.includes(week) && self.allData.push(item.favorite_tab);
    });

    self.allData.sort(function(a, b) {
      return a.position - b.position;
    });
    var modifier_set_ids = []
    self.allData.forEach(function(favorite_tab_item) {
      favorite_tab_item.favorite_sections.forEach(function(favorites) {
        favorites.favorites.forEach(function(favorite) {
          favorite.listing.modifier_set_ids.forEach(function(modifier_id) {
            modifier_set_ids.push(modifier_id)
          });
        });
      })
    });
    self.modifierSet = {}
    modifier_set_ids.forEach(function(item) {
      $.get(self.requestUrl + 'modifier_sets/' + item, {}, function(res) {
        self.modifierSet[res.modifier_set.id] = res.modifier_set
        self.render()
        self.bgTimer()
      })
    });
  });
}

Controller.prototype.bgTimer = function() {
  var self = this
  this.date = moment().format('YYYY-MM-DD')
  this.newDate = moment()
  var isLunch = this.newDate.isBetween(this.date + ' 08:59:59', this.date + ' 17:00:00') ? 1 : 0;
  clearInterval(this.renderTimer)
  this.renderTimer = setInterval(function() {
    self.bgTimer();
    if(isLunch !== self.isLunch) {
      self.render();
    }
  }, 1000);
}

Controller.prototype.render = function() {
  this.date = moment().format('YYYY-MM-DD')
  this.newDate = moment()
  var isLunch = this.isLunch = this.newDate.isBetween(this.date + ' 08:59:59', this.date + ' 17:00:00') ? 1 : 0;
  var favorites_left_length = isLunch ? 7 : 16
  var favorites_right_length = 16
  var menu_left_length = isLunch ? 2 : 1
  var menu_total_length = isLunch ? 5 : 4
  var favorite_tab_left = []
  var favorite_tab_right = []
  var modifier_set = this.modifierSet
  var self = this
  self.afterFilterData = []
  self.allData.forEach(function(item) {
    if(self.newDate.isBetween(self.date + ' ' + item.available_time_from, self.date + ' ' + item.available_time_to)) {
        self.afterFilterData.push(item);
    }
  });
  this.afterFilterData.forEach(function(item, idx) {
    if(idx < menu_left_length) {
      favorite_tab_left.push(item)
    } else if( idx < menu_total_length) {
      favorite_tab_right.push(item)
    }
  });
  var html = '';
  html += '<div class="half left col-md-6">'
  html += '<div class="top">'
  html += isLunch ? '<img src="' + img + '" class="img-responsive"/>' : ''
  html += '</div>'
  html += '<div class="col-md-12">'

  favorite_tab_left.forEach(function(favorite_tab) {
    if (favorite_tab.favorite_sections.length > 0 && favorites_left_length > 0) {
      html += '<table>'
      html += '<thead><tr><th class="th-first">' + favorite_tab.name + '</th><th>價錢</th><th>評分</th></tr></thead>'
      html += '<tbody>'
      favorite_tab.favorite_sections.forEach(function(favorite_sections) {
        favorite_sections.favorites.forEach(function(favorites) {
          if (favorites_left_length <= 0) {
            return false;
          }
          var modifier_set_ids = favorites.listing.modifier_set_ids;
          html += '<tr><td width="70%" class="td-first"><span class="en ' + (modifier_set_ids.length ? "package" : "") + '">' + favorites.listing.name + '</span></td><td width="15%">$' + favorites.listing.price + '</td><td width="15%">'
          if(favorites.listing.image_url) {
            html += '<img src="' + favorites.listing.image_url + '" class=""/>'
          }
          html += '</td></tr>';
          if( modifier_set_ids.length > 0 ) {
            modifier_set_ids.forEach(function(id, idx) {
              if (favorites_left_length > 0 && modifier_set[id]) {
                favorites_left_length--;
                var options = modifier_set[id].modifier_set_options;
                if(options.length > 1) {
                  html += '<tr><td width="70%" class="td-first"><span class="en">(' + (idx + 1) + ') ' + (modifier_set[id].title) + '</span></td><td width="15%"></td><td width="15%">'
                  html += '</td></tr>'
                  options.forEach(function(option) {
                    html += '<tr><td width="70%" class="td-first" style="padding-left: 34px"><span class="en">'+ (option.option_name) + '</span></td><td width="15%"></td><td width="15%">'
                    html += '</td></tr>'
                  })
                } else {
                  html += '<tr><td width="70%" class="td-first"><span class="en">(' + (idx + 1) + ') ' + (modifier_set[id].title) + '</span></td><td width="15%"></td><td width="15%">'
                  html += '</td></tr>'
                }
              }
            });
          } else {
            favorites_left_length--;
          }
        });
      });
      html += '</tbody>'
      html += '</table>'
    }
  });

  html += '</div>'
  html += '</div>'


  html += '<div class="half col-md-6">'
  html += '<div class="col-md-12">'


  favorite_tab_right.forEach(function(favorite_tab) {
    if (favorite_tab.favorite_sections.length > 0 && favorites_right_length > 0) {
      html += '<table>'
      html += '<thead><tr><th class="th-first">' + favorite_tab.name + '</th><th>價錢</th><th>評分</th></tr></thead>'
      html += '<tbody>'
      favorite_tab.favorite_sections.forEach(function(favorite_sections) {
        favorite_sections.favorites.forEach(function(favorites) {
          if (favorites_right_length <= 0) {
            return false;
          }
          var modifier_set_ids = favorites.listing.modifier_set_ids;
          html += '<tr><td width="70%" class="td-first"><span class="en ' + (modifier_set_ids.length ? "package" : "") + '">' + favorites.listing.name + '</span></td><td width="15%">$' + favorites.listing.price + '</td><td width="15%">'
          if(favorites.listing.image_url) {
            html += '<img src="' + favorites.listing.image_url + '" class=""/>'
          }
          html += '</td></tr>';
          if( modifier_set_ids.length > 0 ) {
            modifier_set_ids.forEach(function(id, idx) {
              if (favorites_right_length > 0 && modifier_set[id]) {
                favorites_right_length--;
                var options = modifier_set[id].modifier_set_options;
                if(options.length > 1) {
                  html += '<tr><td width="70%" class="td-first"><span class="en">(' + (idx + 1) + ') ' + (modifier_set[id].title) + '</span></td><td width="15%"></td><td width="15%">'
                  html += '</td></tr>'
                  options.forEach(function(option) {
                    html += '<tr><td width="70%" class="td-first" style="padding-left: 34px"><span class="en">'+ (option.option_name) + '</span></td><td width="15%"></td><td width="15%">'
                    html += '</td></tr>'
                  })
                } else {
                  html += '<tr><td width="70%" class="td-first"><span class="en">(' + (idx + 1) + ') ' + (modifier_set[id].title) + '</span></td><td width="15%"></td><td width="15%">'
                  html += '</td></tr>'
                }
              }
            });
          } else {
            favorites_right_length--;
          }
        });
      });
      html += '</tbody>'
      html += '</table>'
    }
  });

  html += '</div>'
  html += '</div>'
  $("main").html(html);
}
