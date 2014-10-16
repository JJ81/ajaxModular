// 디버깅시 사용할 Deb.js 사용법을 익혀둔다.
// gulp.js를 통해서 자동화할 수 있는 부분을 찾는다.
// 정규식을 사용해서 웹문서의 특정 엘리먼트의 자식노드 전부를 가져오는 스크립트를 만들어볼 것.
/**
 * jquery에서는 IE8을 지원하지 않음.
 * $와 addEventListener에서 오류가 발생
 */

function ajaxModular(settings){
	this.settings = settings;
	this.ajaxOption;
	this.available = true;
	this.xhr = null; // 외부 참조하여 abort 실행을 위해 필요
}

ajaxModular.prototype = {
	makeAjaxOption : function () {
		var _self = this; // 내부함수 스코프 상실 문제 해결
		_self.ajaxOption = 
		{
			url : _self.settings.url,
			type : _self.settings.type, // GET or POST, default는 GET
			data : _self.settings.data,
			dataType : _self.settings.dataType,
			
			context: document.body, // get body's childNode element, 제대로 작동하지 않는 듯 보임.
			mimeType : null,
			async : true, // 비동기 플래그, true 일 경우 요청을 기다리는 동안 다른 작업을 수행하게 된다. false일 경우에는 결과가 반환될 때까지 실행을 멈추게 된다. 
			// 콜백함수를 사용하지 않고 서버에 요청을 보내 처리된 결과가 올때까지 정지가 되면 결과 처리가 단순해지지만 비동기통신능력이 핵심인 ajax에서는 단점이 될 수도 있다. 따라서 항상 true로 설정해 놓는 것이 좋다.
			// async의 기본값은 항상 true
		
			beforeSend : function() {
				console.log("beforeSending...");
				progress.prepareElement(rootPath+"/resources/kakaopage/v3.0.0/images/ajax-loader.gif");
				progress.show();
			},
			progress : function () { // ??
				console.log("progressing...");
			},
			success : function(data, textStatus, jqXHR) { // or complete, done
				console.log( data );

				console.log( jqXHR);
				console.log( textStatus ); // success
				console.log( jqXHR.readyState ); // 4
				/*
				 * readyState
				 * 0 초기화 안됨.open함수 호출전
				 * 1 로딩중, send함수 호출전
				 * 2 로딩됨, send함수호출 후 결과값이 없는 상태
				 * 3 인터랙티브, 다운로드중이며 일부 데이터가 responseText에 저장된 상태임.
				 * 4 완료
				 * */
				
				console.log(jqXHR.status); // 200
				console.log(jqXHR.statusText); // ok
				console.log(jqXHR.getAllResponseHeaders() ); // 헤더 정보
				
				if (!data || !_isHtml(jqXHR))
                    return;
                
                settings.target.append(data);
                progress.hide();
				// data에 추가 가공이 필요한 경우 이곳에서 해결을 해야 함.
			},
			// parameter : xhr, textStatus, errorThrown
			error : function(data, status, err) { // or fail
				//console.log(data);
				//console.log( data.readyState ); // 4
				//console.log( data.status ); // 404
				//console.log(status); // error, 404일때도 error표시가 발생
				//console.log(err); // Not Found

				if(data.status == "404" || err === "Not Found") {
					alertAction("더이상 데이터가 없습니다.");
					$("."+_self.settings.buttonClass+"").remove();
				} else { // ajax 취소시 이곳으로 장애를 발생시킨다.
					alertAction("일시적인 장애가 발생하였습니다. 잠시후에 다시 시도해주세요.");
					
					//  더보기 버튼 위치에 리프레시 버튼 or 다시 시도버튼을 삽입한다. 
					// 혹은 전체 투명 배경색을 깔고 리프레시버튼을 가운데에 보여준다.
					
				}
				
				_self.available = false;
				progress.hide();
			},
			then : function () { // 이중 ajax와 그 외의 어떤 기능?
				
			}
		};
	},
	
	callAjax : function (startPage) {
		if(this.available){
			this.ajaxOption.url = this.settings.url + startPage;
			this.xhr = $.ajax(this.ajaxOption);
		}
	},
	
	stopAjax : function () {
		this.xhr.abort();
		console.log("stop ajax...");
	}
};

var rootPath = $(".rootPath").val();
var progress = { // UI process, 변수 네이밍 변경할 것.
		prepareElement : function (imgPath) {
			this.loadImage = "<div class='ajax_loader blind'><img src='"+imgPath+"' alt='ajax-loader' width='40' /><br />Loading...</div>";
			this.bgProgress = "<div class='bg_progress blind'></div>";
			this.latency = 500;

			if($(".bg_progress").length < 1)
				$("body").append(this.loadImage+this.bgProgress);
			this.setDesign();
		},
		show : function () {
			// 스크롤 방지
			preventScroll();
			$(".ajax_loader").removeClass("blind");
			$(".bg_progress").removeClass("blind");
			$(".moreBtn").addClass("blind");
		},
		hide : function (target) {
			setTimeout(function () {
				$(".ajax_loader").addClass("blind");
				$(".bg_progress").addClass("blind");
				$(".moreBtn").removeClass("blind");
				// 스크롤 방지 해제
				releaseScroll();
			},this.latency);
		},
		setDesign : function () {
			$(".bg_progress").css("height", getDocHeight());
			$(".ajax_loader").css("top", getWinHeight()/2 - $(".ajax_loader").height()/2 + getScrollPositionY());
		}
};

/*
	변수에 DOM을 저장하고 
	cleanUp메소드로 DOM을 저장한 변수를 null로 제거한다.
	 window.onunload 이벤트를 통해서 처리한다.

	불안전한 네트워크 상태로 실패한 경우
	서버의 일시적인 장애로 실패한 경우
	앱오작동한 경우
	앱의 특정한 상태인 경우
	
*/
// 퍼사드 // 하나의 메소드 너무 많은 기능을 삽입하지 않게 설계하자!!
var Status = new function () {
	this.statusMessage = null;
	this.appStatus = null; // stopped, running // running시 다른 요청을 받지 않도록 처리한다. async가 true일 경우, 데이터를 불러오면서 동시에 처리해야 할 것이 있다면 어떤 경우에 그러한가?
	this.serverStatus = null; // done, abort, proc, failed, error
	this.timeout = null;
	this.limitedTime = 5000; // 임의 설정

	this.init = function () {
		// 초기 설정

	};
	// 응답에 따른 서버상태
	this.setServerStatus = function () {
	
	};
	this.getServerStatus = function() {
	
	};
	// 상태에 따른 메시지 설정
	this.setStatusMessage = function () {
		
	};
	this.getStatusMessage = function () {
	
	};
	// 앱상태 
	this.setAppStatus = function () {

	};
	this.getAppStatus = function () {

	};
	// 폴링시간 카운트
	this.setHandleTime = function () {
		
	};
	this.getHandleTime = function () {

	};
}



/**
 * Common Utility
 */
function getWinWidth() {
	return parseInt(window.innerWidth);
}

function getWinHeight() {
	return parseInt(window.innerHeight);
}

function getDocHeight() {
	return parseInt($(document).height());
}

function getScrollPositionX() {
	return parseInt(window.pageXOffset);
}

function getScrollPositionY() {
	return parseInt(window.pageYOffset);
}

function scrollControl(e){
	e = e || window.event;
	  if (e.preventDefault)
	      e.preventDefault();
	  e.returnValue = false;
}

function preventScroll(){
	if (window.addEventListener) {
		window.addEventListener('DOMMouseScroll', scrollControl, false);
    }else{
    	window.attachEvent('DOMMouseScroll', scrollControl);
    }
	window.onmousewheel = document.onmousewheel = scrollControl;
	$('body').bind('touchmove', function(e){
		e.preventDefault();
	});
}

function releaseScroll(){
	if (window.removeEventListener) {
        window.removeEventListener('DOMMouseScroll', scrollControl, false);
    }else{
    	window.DetachEvent('DOMMouseScroll', scrollControl);
    }
    window.onmousewheel = document.onmousewheel = null;
    $('body').unbind('touchmove');
}

function alertAction (msg) {
	try{
		console.log(msg);
	}catch(e){
		alert(e);
	}
}

/**
 * Returns true if the user hit Esc or navigated away from the
 * current page before an AJAX call was done. (The response
 * headers will be null or empty, depending on the browser.)
 *
 * NOTE: this function is only meaningful when called from
 * inside an AJAX "error" callback!
 *
 * The 'xhr' param is an XMLHttpRequest instance.
 */
function userAborted(xhr) {
  return !xhr.getAllResponseHeaders();
}

function _isHtml(x) { //restrict interesting MIME types - only HTML / XML
    var d;
    return (d = x.getResponseHeader("Content-Type")), d && (d.iO("text/html") || d.iO("text/xml"));
}

//Intuitively better understandable shorthand for String.indexOf() - String.iO()
String.prototype.iO = function(s) { return this.toString().indexOf(s) + 1; };

//Regexes for escaping fetched HTML of a whole page - best of Balupton's "Ajaxify"
//Makes it possible to pre-fetch an entire page
//var docType = /<\!DOCTYPE[^>]*>/i;
//var tagso = /<(html|head|body|title|meta|script|link)([\s\>])/gi;
//var tagsc = /<\/(html|head|body|title|meta|script|link)\>/gi;
//Helper strings
//var div12 =  '<div class="ajy-$1"$2';
//var linki = '<link rel="stylesheet" type="text/css" href="*" />', scri='<script type="text/javascript" src="*" />';
//var linkr = 'link[href*="!"]', scrr = 'script[src*="!"]';

//function _parseHTML(h) { //process fetched HTML
//    return $.trim(_replD(h));
//}
//
//function _replD(h) { //pre-process HTML so it can be loaded by jQuery
//    return String(h).replace(docType, "").replace(tagso, div12).replace(tagsc, "</div>");
//}
