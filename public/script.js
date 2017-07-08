// Code goes here
var app = angular.module("simbudget", ["chart.js", 'ngAnimate', 'ui.bootstrap', 'firebase', 'pascalprecht.translate']);


app.factory("Auth", function($firebaseAuth){
	var ref = new Firebase("https://simbudget.firebaseio.com/");
	return $firebaseAuth(ref);
});

app.config(function($translateProvider){

	$translateProvider.translations('en',{
		'SUB_TITLE':"simulate your cash-flow",
		"DOCUMENTS":"Documents",
		"RULES":"Rules",
		"ADD_RULES":"Add Rules",
		"UNTITLED":"Untitled",
		"INIT_VALUE":"Initial value",
		"SAVE":"Save",
		"RULE_TYPE":"Rule type",
		"PERIODIC":"Periodic",
		"SPECIFIC":"Specific",
		"NAME":"Name",
		"PERIOD":"Period",
		"EACH":"Each",
		"DAY":"Day",
		"WEEK":"Week",
		"MONTH":"Month",
		"YEAR":"Year",
		"START_DATE":"Start date",
		"END_DATE":"End date",
		"AMOUNT":"Amount",
		"DATE":"Date",
		"REMOVE":"Remove",
		"SIMULATE":"Simulate",
		"DAYS":"Days",
		"RESULT":"Result",
		"TABLE":"Table",
		"GRAPH":"Graph",
		"NO_RESULT":"No Result",
		"TOO_MANY_DOC":"Too many documents",
		"TOO_MANY_RULES":"Too many rules",
		"SIGNUP_WITH_GOOGLE":"Signup with google account",
		"LOGIN":"Login",
		"LOGOUT":"Logout",
		"SIGNUP_FIRST_TXT":"Please signup first.",
		"SELECT_DOC_TXT":"Please select document.",
		"RULES_TOGGLE":"Rules",
		"RESULT_TOGGLE":"Result",
		"FULL_TOGGLE":"Full",
		"ACC":"acc",
		"DELTA":"delta",
		"RELOAD":"Reload",
		"SAVE_COMPLETE":"Save complete",
		"PERIODIC_TITLE":"{{amount}} per {{period}} {{periodType}}",
		"SPECIFIC_TITLE":"{{amount}} at {{date}}",
		"NOT_SPECIFIED":"Unspecified",
		"NA":"N/A"
	});

	$translateProvider.translations('ko',{
		'SUB_TITLE':"캐시플로우를 테스트 해보세요",
		"DOCUMENTS":"문서",
		"RULES":"규칙",
		"ADD_RULES":"규칙 추가",
		"UNTITLED":"제목없음",
		"INIT_VALUE":"시작 자금",
		"SAVE":"저장",
		"RULE_TYPE":"규칙 종류",
		"PERIODIC":"주기적 발생",
		"SPECIFIC":"특정일 발생",
		"NAME":"이름",
		"PERIOD":"반복주기",
		"EACH":"매",
		"DAY":"일",
		"WEEK":"주",
		"MONTH":"개월",
		"YEAR":"년",
		"START_DATE":"규칙 시작일",
		"END_DATE":"규칙 종료일",
		"AMOUNT":"금액변동",
		"DATE":"일시",
		"REMOVE":"삭제",
		"SIMULATE":"시뮬레이션",
		"DAYS":"일치 실행",
		"RESULT":"결과",
		"TABLE":"표",
		"GRAPH":"그래프",
		"NO_RESULT":"결과가 없습니다.",
		"TOO_MANY_DOC":"문서는 현재 2개까지 만들 수 있습니다.",
		"TOO_MANY_RULES":"규칙은 현재 10개까지 만들 수 있습니다.",
		"SIGNUP_WITH_GOOGLE":"구글계정으로 이용",
		"LOGIN":"로그인",
		"LOGOUT":"로그아웃",
		"SIGNUP_FIRST_TXT":"가입후 사용이 가능합니다.",
		"SELECT_DOC_TXT":"문서를 선택해주세요.",
		"RULES_TOGGLE":"규칙",
		"RESULT_TOGGLE":"결과",
		"FULL_TOGGLE":"전체화면",
		"ACC":"누적",
		"DELTA":"변화",
		"RELOAD":"새로고침",
		"SAVE_COMPLETE":"저장 완료",
		"PERIODIC_TITLE":"{{period}} {{periodType}} 마다 {{amount}}",
		"SPECIFIC_TITLE":"{{date}} 에 {{amount}}",
		"NOT_SPECIFIED":"미정",
		"NA":"미정"
	});

	var userLang = navigator.language || navigator.userLanguage; 
	if(userLang == "ko")
		$translateProvider.preferredLanguage('ko');
	else
		$translateProvider.preferredLanguage('en');


});


app.controller('MainCtrl', function($scope, $filter, $timeout, $uibModal, $firebaseObject, $firebaseArray, $translate, Auth) {
	
	$scope.documents = [];
	$scope.actionDict = {};

	$scope.opt = {
		lang:"ko"
	}
	
	$scope.viewOpt = {
		rules:true,
		result:true,
		fullSize:false,
		graph:true
	}
	$scope.runOpt = {
		duration:365
	}

	Auth.$onAuth(function(){
		$scope.authData = Auth.$getAuth();
		if( !!$scope.authData ){

			//Load List from fire base
			$scope.userRootRef = new Firebase("https://simbudget.firebaseio.com/user_data/"+$scope.authData.uid);
			var list = $firebaseArray($scope.userRootRef.child("documents"));
			ga('set', 'userId', $scope.authData.uid);

			list.$loaded(function(v){
				
				//on load compelete
				$scope.documents = list;
				if($scope.documents.length ==0) { //if empty, make default document.
					$scope.addNewDoc().then(function(ref){
						$scope.selectDocByRef(ref);
					});
				}else{
					$scope.selectDoc($scope.documents[0]);	
				}
				
			});
		}
	});


	$scope.onLoginClick = function() {
		Auth.$authWithOAuthRedirect("google", function(error) {
			if (error) {
				console.log("Login Failed!", error);
			} else {
				// We'll never get here, as the page will redirect on success.
			}
		});
	}

	$scope.onLogoutClick = function() {
		Auth.$unauth();	
		$scope.authData = null;
		location.reload();
	}

	$scope.getAccountOwnerName = function( authData ) {
		if("google" in authData){
			return "Google account " + authData['google'].displayName;
		}
	}
	
	
	$scope.dateOptions = {
		dateDisabled:	function (data) {
			var date = data.date,
				mode = data.mode;
			return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
		},
		formatYear: 'yy',
		maxDate: new Date(2020, 5, 22),
		minDate: new Date(),
		startingDay: 1
	};
	
	
	$scope.onClickAdd = function() {
		//console.log($scope.currentDoc.condList);
		var titleStr =  $translate("UNTITLED").then(function(v){
			console.log(titleStr);
			if($scope.currentDoc.condList.length < 10){
				$scope.currentDoc.condList.push({
					type:"periodic",
					name:v,
					periodType:"day",
					period:1,
					amount:-10000
				});
			}else{
				alert($scope.translate("TOO_MANY_RULES"))
			}
		})
	}
	
	$scope.onClickRemove = function($index) {
		$scope.currentDoc.condList.splice($index, 1)
	}
	
	$scope.getDataInfo = function(data) {
		return JSON.stringify(data);
	}
	
	$scope.initGraphData = function(){
		if(!$scope.labels)
			$scope.labels = [];
		else
			$scope.labels.length = 0;
		
		if(!$scope.series)
			$scope.series = ['acc', 'delta'];
		
		if(!$scope.data)
			$scope.data = [[],[]];
		else{
			$scope.data[0].length = 0;
			$scope.data[1].length = 0;
		}
	}
	
	$scope.run = function() {

		if(!$scope.currentDoc)
			return;
		
		$scope.initGraphData();
		
		var startDate = new Date();
		var endDate = new Date(startDate);
		endDate.setDate(endDate.getDate()+parseInt($scope.runOpt.duration));
		
		var accValue = parseInt($scope.currentDoc.initialValue);
		var actionDict = $scope.getActionDict(startDate, endDate);
		var curDate = new Date(startDate);
		
		while(curDate <= endDate) { 
			
			var key = curDate.toLocaleDateString();
			var value = key in actionDict ? actionDict[key] : 0;
			
			$scope.labels.push(key);
			accValue += parseInt(value);
			$scope.data[0].push(accValue);
			$scope.data[1].push(value);
			
			curDate.setDate(curDate.getDate()+1);
		}

		$scope.graphLabels = $scope.labels.slice();
		if($scope.graphLabels.length > 60) {
			$scope.showOnlyMonthLabel();
		}
		
	}

	$scope.showOnlyMonthLabel = function(){

		var lastMonth = null;
		for(var i=0;i<$scope.graphLabels.length;i++){
			var date = new Date($scope.graphLabels[i]);
			if(lastMonth == null || lastMonth != date.getMonth()){
				lastMonth = date.getMonth();
			}else{
				$scope.graphLabels[i] = "";
			}
				
		}
	}


	
	//Core function.
	$scope.getActionDict = function(startDate, endDate) {
		
		var dict = {};
		var addActionValue = function(date, value) {
			var key = date.toLocaleDateString();
			if(key in dict)
				dict[key] += parseInt(value);
			else
				dict[key] = parseInt(value);
		}
		
		//Get Periodic actions
		var periodicList = $scope.currentDoc.condList.filter(function(e){ return e.type == 'periodic'});
		periodicList = periodicList.slice(); //clone

		periodicList.forEach( function(e){
			
			if(!e.startDateExist || !e.startDate) e.startDate = startDate;	
			if(!e.endDateExist || !e.endDate) e.endDate = endDate;
			if(!e.period) e.period = 1;
			

			var curDate = new Date(e.startDate);

			while( curDate <= e.endDate ) {
				addActionValue(curDate, e.amount);
				var p = parseInt(e.period);
				switch(e.periodType){
					case 'day': curDate.setDate(curDate.getDate() + p);	break;
					case 'week': curDate.setDate(curDate.getDate() + p*7);	break;
					case 'month': curDate.setMonth(curDate.getMonth() + p);	break;
					case 'year': curDate.getFullYear(curDate.getFullYear() + p);	break;
				}
			}
			
		});
		
		//Get Specific actions
		var specificList = $scope.currentDoc.condList.filter(function(e){ return e.type == 'specific'});
		specificList = specificList.slice(); //clone
		specificList.forEach( function(e){
			if(!!e.specificDate)
				addActionValue(e.specificDate, e.amount)
		});
		
		
		return dict;
		
	}

	//Save
	$scope.saveCurrentDoc = function(doc) {

		$scope.currentDoc.$save().then(function(ref) {
			alert($scope.translate("SAVE_COMPLETE"));
		})
	}

	//Load
	$scope.selectDocByRef = function(ref) {

		if(!!$scope.unbind){
			$scope.unbind();
			$scope.unbind = null;
		}

		var doc = $firebaseObject(ref);
		doc.$loaded().then(function(){
			
			$scope.currentDoc = doc;

			doc.$bindTo($scope, "currentDoc").then(function(unbind){
				$scope.unbind = unbind;
			})

			var periodicList = $scope.currentDoc.condList.filter(function(e){ return e.type == 'periodic'});
			periodicList.forEach(function(e){
				if(e.startDateExist && !!e.startDateStr)	e.startDate = new Date(e.startDateStr);
				if(e.endDateExist && !!e.startDateStr)		e.endDate 	= new Date(e.endDateStr);
			});

			var specificList = $scope.currentDoc.condList.filter(function(e){ return e.type == 'specific'});
			specificList.forEach(function(e){
				if(!!e.specificDateStr) e.specificDate = new Date(e.specificDate);
			});

			$scope.initGraphData();

		});

	}

	$scope.selectDoc = function(doc) {
		var ref = $scope.userRootRef.child("documents").child(doc.$id);
		$scope.selectDocByRef(ref);
	}

	$scope.addNewDoc = function() {
		if($scope.documents.length>=2){
			alert($scope.translate('TOO_MANY_DOC'));
			return;
		}
		return $scope.documents.$add({
			name:$scope.translate('UNTITLED'), 
			initialValue:10000000,
			condList:[{
				type:"periodic",
				name: $scope.translate('UNTITLED'),
				periodType:"day",
				period:1,
				amount:-10000
			}]
		});
	}

	$scope.reloadGraph = function() {
		$scope.viewOpt.graph = false;
		$timeout(function(){
			$scope.viewOpt.graph = true;
		}, 100);
	}

	$scope.onClickLang = function(lang) {
		$translate.use(lang);
		$scope.opt.lang = lang;
	}

	$scope.translate = function(key, interpolateParams) {
		var value = $translate.instant(key, interpolateParams);
		return value;
	}

	$scope.getPeriodicRuleTitle = function(inputData) {
		return $scope.translate("PERIODIC_TITLE", {
			period:inputData.period,
			periodType:$scope.translate(inputData.periodType.toUpperCase()),
			amount:$filter('number')(inputData.amount)
		})
	}

	$scope.getSpecificRuleTitle = function(inputData) {
		var dateStr 
		if( !!inputData.specificDate ) {
			dateStr = inputData.specificDate.toLocaleDateString();
		}else{
			dateStr = $scope.translate('NOT_SPECIFIED');
		}
		return $scope.translate("SPECIFIC_TITLE", {
				date:dateStr,
				amount:inputData.amount});
	}

	$scope.openPayment = function() {
		

		$uibModal.open({
			animation: true,
			templateUrl: 'paymentModal.html',			
			size:"sm",
			controller: function($scope,  $uibModalInstance){
				$scope.close = function(){
					$uibModalInstance.dismiss();
				}
			},
			resolve: {
				items: function () {
					return $scope.items;
				}
			}
		});




	}
	
});

