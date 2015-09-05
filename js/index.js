define(function (require) {
    var currentTimeIndex = 0;
    var model = require('./model');
    var tmpl = require('./tmpl');

    var domEvents = {
        onClickTimeListItem: function (e) {
            e.preventDefault();
            if(this.timeTouchisMoving) {
                return false;
            }
            $(e.currentTarget).siblings().removeClass('currentTimeItem');
            $(e.currentTarget).addClass('currentTimeItem');
            var index = +$(e.currentTarget).attr('data-index');

            if(index > 3) {
                this.$timePrev.addClass('time-prev-change');
                this.$timeNext.addClass('time-next-change');
            } else if (index === 3) {
                this.$timePrev.addClass('time-prev-change');
                this.$timeNext.removeClass('time-next-change');
            } else {
                this.$timeNext.removeClass('time-next-change');
                this.$timePrev.removeClass('time-prev-change');
            }
            this.date = $(e.currentTarget).attr('data-type');

            this.moveToItem(index);

            this.filterContentItem();
        },
        onClickTimePrev: function (e) {
            e.preventDefault();
            this.$timeListInner.animate({
                    left: '0px'
                }, 'fast');
            this.$timeNext.removeClass('time-next-change');
            this.$timePrev.removeClass('time-prev-change');
        },
        onClickTimeNext: function (e) {
            e.preventDefault();
            this.$timeListInner.animate({
                    left: '-40%'
                }, 'fast');
            this.$timePrev.addClass('time-prev-change');
            this.$timeNext.addClass('time-next-change');
        },
        onTimeTouchstartEvent: function (e) {
            e.stopPropagation();
            if (e.originalEvent.touches.length > 1) {
                return false;
            }

            this.timeTouchX = e.originalEvent.touches[0].clientX;

            this.$timeListInner.on('touchmove', '.time-list-item',$.proxy(domEvents.onTimeTouchmoveEvent, this));
            this.$timeListInner.on('touchend', '.time-list-item', $.proxy(domEvents.onTimeTouchendEvent, this));
        },
        onTimeTouchmoveEvent: function (e) {
            e.stopPropagation();
            if (e.originalEvent.touches.length > 1) {
                return false;
            }

            e.preventDefault();
            this.timeDistanceX = this.timeTouchX - e.originalEvent.touches[0].clientX;

            this.$timeListInner.css('left', -this.timeDistanceX);

            this.timeTouchisMoving = true;
        },
        onTimeTouchendEvent: function (e) {
            e.stopPropagation();

            if (this.timeTouchisMoving) {
                this.$timeListInner.off('touchmove', '.time-list-item', $.proxy(domEvents.onTimeTouchmoveEvent, this));
                this.$timeListInner.off('touchend', '.time-list-item', $.proxy(domEvents.onTimeTouchendEvent, this));

                this.timeTouchisMoving = false;

                var timeListInnerLeft = parseInt(this.$timeListInner.css('left'));
                if(timeListInnerLeft > 0) {
                    this.$timeListInner.animate({
                        left: '0px'
                    }, 'fast');
                } else if (timeListInnerLeft < -2 * this.timeListItemWidth) {
                    this.$timeListInner.animate({
                        left: -2 * this.timeListItemWidth
                    }, 'fast');
                }
            }
        },
        onTouchstartEvent: function (e) {
            e.stopPropagation();

            if (e.originalEvent.touches.length > 1) {
                return false;
            }

            if (this.deleteShowedItem) {
                this.hideDeleteButton(this.deleteShowedItem);
                return;
            }

            this.touchX = e.originalEvent.touches[0].clientX;

            this.$contentList.on('touchmove', '.content-list-item-main', $.proxy(domEvents.onTouchmoveEvent, this));
            this.$contentList.on('touchend', '.content-list-item-main', $.proxy(domEvents.onTouchendEvent, this));

        },
        onTouchmoveEvent: function (e) {
            e.stopPropagation();
            if (e.originalEvent.touches.length > 1) {
                return false;
            }

            this.distanceX = this.touchX - e.originalEvent.touches[0].clientX;

            $(e.currentTarget).parent('.content-list-item-inner').css('left', -this.distanceX);

            this.touchisMoving = true;
        },
        onTouchendEvent: function (e) {
            e.stopPropagation();
            e.preventDefault();

            this.$contentList.off('touchmove', '.content-list-item-main', $.proxy(domEvents.onTouchmoveEvent, this));
            this.$contentList.off('touchend', '.content-list-item-main', $.proxy(domEvents.onTouchendEvent, this));

            if (this.touchisMoving) {

                var contentListInnerLeft = parseInt($(e.currentTarget).parent('.content-list-item-inner').css('left'));

                var halfDeleteWidth = $('.content-list-item-delete').width() / 2;

                this.touchisMoving = false;

                if (contentListInnerLeft > -halfDeleteWidth) {
                    this.hideDeleteButton(e.currentTarget);
                } else {
                    this.showDeleteButton(e.currentTarget);
                }
            } else {
                var id = +$(e.currentTarget).attr('data-id');
                this.renderDetail(id);
            }
        },
        onClickFooterListItem: function (e) {
            e.preventDefault();

            this.type = $(e.currentTarget).attr('data-type');

            this.filterContentItem();

            $('.currentFooterItem').removeClass('currentFooterItem');
            $(e.currentTarget).addClass('currentFooterItem');
        }
    };

    var page = {
        initialize: function () {
            //set status data
            this.date = null;
            this.type = 'all';
            this.deleteShowedItem = null;
            this.touchisMoving = false;
            this.timeTouchisMoving = false;
            this.timeListItemWidth = $('.time-list-item').width();
            //set elem
            this.$timeListInner = $('.time-list-inner');
            this.$timePrev = $('.time-prev');
            this.$timeNext = $('.time-next');
            this.$contentList = $('.content-list');
        },
        init: function () {
            this.initialize();
            this.bindEvents();
            this.render();
        },
        render: function () {
            $('.currentTimeItem').removeClass('currentTimeItem');
            $('.currentFooterItem').removeClass('currentFooterItem');
            $($('.footer-list-item-link')[0]).addClass('currentFooterItem');
            var tpl = $('#tpl-content').html();
            var result = tmpl(tpl, {
                data: model.data
            });
            this.$contentList.html(result);
        },
        renderDetail: function (id) {
            var tpl = $('#tpl-subwrapper').html();
            var result = tmpl(tpl, {
                data: model.getData(id).data
            });
            $('.subwrapper').html(result);

            $('.wrapper').hide();
            $('.subwrapper').show();
        },
        addContentItem: function (id, tagValue, dateValue) {
            $.ajax({
                url: 'https://api.douban.com/v2/movie/subject/' + id,
                dataType: 'jsonp',
                success: function (response) {
                    model.addData(tagValue, dateValue, response);
                    this.render();
                }.bind(this)
            });
        },
        showDialog: function() {
            $('.mask').show();
            $('.dialog').show();
        },
        hideDialog: function() {
            $('.mask').hide();
            $('.dialog').hide();
        },
        getItemId: function() {
            var question = $('#dialog-title').val();
            $.ajax({
                dataType:'jsonp',
                url: 'https://api.douban.com/v2/movie/search?q=' + question,
                success: function(response) {
                    this.hideDialog();
                    var id = response.subjects[0].id;
                    var tag = $('#dialog-savePath option:selected').attr('data-type');
                    var date = $('#dialog-date option:selected').attr('data-type');
                    this.addContentItem(id, tag, date);
                }.bind(this)
            });
        },
        filterContentItem: function () {
            var data = model.getSelectedData(this.type,this.date);
            var tpl = $('#tpl-content').html();
            var result = tmpl(tpl, {
                data: data
            });
            this.$contentList.html(result);
        },
        moveToItem: function (index) {
            var targetPos;
            if (index === 3) {
                targetPos = this.timeListItemWidth;
            } else if (index > 3){
                targetPos = 2 * this.timeListItemWidth;
            } else {
                targetPos = 0;
            }
            this.$timeListInner.animate({
                        left: -targetPos + 'px'
                    }, 'fast');
        },
        bindEvents: function () {
            //time-item选择
            this.$timeListInner.on('click', '.time-list-item', domEvents.onClickTimeListItem.bind(this));

            //time滑动效果
            this.$timeListInner.on('touchstart', '.time-list-item', domEvents.onTimeTouchstartEvent.bind(this));

            //time前翻
            this.$timePrev.click(domEvents.onClickTimePrev.bind(this));
            //time后翻
            this.$timeNext.click(domEvents.onClickTimeNext.bind(this));

            //content滑动效果
            this.$contentList.on('touchstart', '.content-list-item-main', domEvents.onTouchstartEvent.bind(this));

            //删除content-item
            this.$contentList.on('click', '.content-list-item-delete', function(event) {
                event.preventDefault();
                var id = +$(event.currentTarget).prev().attr('data-id');

                model.deleteData(id);
                this.render();

            }.bind(this));

            //footer-item选择
            $('.footer-list').on('click', '.footer-list-item-link', domEvents.onClickFooterListItem.bind(this));

            //dialog的展现
            $('.header-add').click(function (event) {
                event.preventDefault();
                this.showDialog();
            }.bind(this));

            //dialog的隐藏
            $('.dialog-ft').click(function (event) {
                event.preventDefault();
                this.hideDialog();
            }.bind(this));

            //内容的添加
            $('.dialog-bd-submit').on('click', function (event){
                event.preventDefault();
                this.getItemId();
            }.bind(this));

            //subwrapper的隐藏
            $('.subwrapper').on('click','.subwrapper-hd-link', function (event) {
                event.preventDefault();
                $('.subwrapper').hide();
                $('.wrapper').show();
            });


        },
        showDeleteButton: function (itemElem) {
            $(itemElem).parent('.content-list-item-inner').animate({
                left: '-25%'
            },'fast');
            this.deleteShowedItem = itemElem;
        },
        hideDeleteButton: function (itemElem) {
            $(itemElem).parent('.content-list-item-inner').animate({
                left: '0px'
            },'fast');
            this.deleteShowedItem = null;
        }

    }
    return page;
});