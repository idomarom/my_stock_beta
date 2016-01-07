//angular.module('myStock', ['ngAnimate', 'ui.bootstrap']);
//angular.module('myStock').controller('TypeaheadCtrl', function($scope, $http) {
//
//    // Any function returning a promise object can be used to load values asynchronously
//    $scope.completeSymbol = function(symbol,size) {
//        return $http.get('https://widgetdata.tradingview.com/search/?text=' + symbol + '&exchange=&type=')
//            .then(function(response){
//            return response.data.slice(0,size).map (function(item){ //slicing the number of result shown
//              return "\"" + item.symbol + "\", " + item.exchange + " " + item.description + ", " + item.type;
//            });
//        });
//    };
//});