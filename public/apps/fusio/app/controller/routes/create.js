'use strict'

var angular = require('angular')

module.exports = function ($scope, $http, $uibModal, $uibModalInstance, $timeout, fusio) {
  $scope.route = {
    path: '',
    scopes: [],
    config: []
  }

  $scope.methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  $scope.schemas = []
  $scope.actions = []

  $scope.indexVersion = -1
  $scope.indexMethod = []
  $scope.responseCode = '200'

  $scope.statuuus = [{
    key: 4,
    value: 'Development'
  }, {
    key: 1,
    value: 'Production'
  }, {
    key: 2,
    value: 'Deprecated'
  }, {
    key: 3,
    value: 'Closed'
  }]

  $scope.statusCodes = {
    '200': 'OK',
    '201': 'Created',
    '202': 'Accepted',
    '204': 'No Content',
    '205': 'Reset Content',
    '226': 'IM Used',
    '300': 'Multiple Choices',
    '301': 'Moved Permanently',
    '302': 'Found',
    '303': 'See Other',
    '304': 'Not Modified',
    '307': 'Temporary Redirect',
    '308': 'Permanent Redirect',
    '400': 'Bad Request',
    '402': 'Payment Required',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '408': 'Request Timeout',
    '409': 'Conflict',
    '410': 'Gone',
    '412': 'Precondition Failed',
    '417': 'Expectation Failed',
    '422': 'Unprocessable Entity',
    '423': 'Locked',
    '424': 'Failed Dependency',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '501': 'Not Implemented',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
    '507': 'Insufficient Storage',
    '508': 'Loop Detected'
  }

  $scope.create = function (route) {
    var data = angular.copy(route)
    var i

    if (angular.isArray(data.scopes)) {
      var scopes = []
      for (i = 0; i < data.scopes.length; i++) {
        scopes.push(data.scopes[i].text)
      }
      data.scopes = scopes
    }

    // remove empty responses
    if (angular.isObject(data.config)) {
      for (i = 0; i < data.config.length; i++) {
        if (angular.isObject(data.config[i].methods)) {
          for (var method in data.config[i].methods) {
            if (data.config[i].methods.hasOwnProperty(method) && angular.isObject(data.config[i].methods[method].responses)) {
              for (var code in data.config[i].methods[method].responses) {
                if (data.config[i].methods[method].responses.hasOwnProperty(code) && !data.config[i].methods[method].responses[code]) {
                  delete data.config[i].methods[method].responses[code]
                }
              }
            }
          }
        }
      }
    }

    $http.post(fusio.baseUrl + 'backend/routes', data)
      .then(function (response) {
        var data = response.data
        $scope.response = data
        if (data.success === true) {
          $uibModalInstance.close(data)
        }
      })
      .catch(function (response) {
        $scope.response = response.data
      })
  }

  $http.get(fusio.baseUrl + 'backend/action?count=1024', {cache: true})
    .then(function (response) {
      $scope.actions = response.data.entry
    })

  $http.get(fusio.baseUrl + 'backend/schema?count=1024', {cache: true})
    .then(function (response) {
      $scope.schemas = response.data.entry
    })

  $scope.close = function () {
    $uibModalInstance.dismiss('cancel')
  }

  $scope.closeResponse = function () {
    $scope.response = null
  }

  $scope.addVersion = function () {
    var versions = $scope.route.config
    versions.push($scope.newVersion())

    $scope.route.config = versions

    $timeout(function () {
      $scope.indexVersion = ($scope.route.config.length - 1)
      $scope.indexMethod.push(0)
    })
  }

  $scope.newVersion = function () {
    return {
      version: $scope.getLatestVersion() + 1,
      status: 4,
      methods: {
        GET: $scope.newMethod(),
        POST: $scope.newEmptyMethod(),
        PUT: $scope.newEmptyMethod(),
        PATCH: $scope.newEmptyMethod(),
        DELETE: $scope.newEmptyMethod()
      }
    }
  }

  $scope.newMethod = function () {
    return {
      active: true,
      public: true,
      responses: {
        '200': 'Passthru'
      },
      action: ''
    }
  }

  $scope.newEmptyMethod = function () {
    return {
      active: false,
      responses: {}
    }
  }

  $scope.getLatestVersion = function () {
    var version = 0
    for (var i = 0; i < $scope.route.config.length; i++) {
      var ver = parseInt($scope.route.config[i].version)
      if (ver > version) {
        version = ver
      }
    }
    return version
  }

  $scope.addResponse = function (code) {
    var method = $scope.methods[$scope.indexMethod]
    if (!$scope.route.config[$scope.indexVersion].methods[method].responses) {
      $scope.route.config[$scope.indexVersion].methods[method].responses = {}
    }
    if (!$scope.route.config[$scope.indexVersion].methods[method].responses[code]) {
      $scope.route.config[$scope.indexVersion].methods[method].responses[code] = 1
    }
  }

  $scope.removeResponse = function (code) {
    var method = $scope.methods[$scope.indexMethod]
    var responses = $scope.route.config[$scope.indexVersion].methods[method].responses
    delete responses[code]

    $scope.route.config[$scope.indexVersion].methods[method].responses = responses
  }

  $scope.addVersion()
}
