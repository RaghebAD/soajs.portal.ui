"use strict";

var uracApp = soajsApp.components;
uracApp.controller("uracListTenantsModuleStgCtrl", ['$scope', 'ngDataApi', '$cookies', '$localStorage', function ($scope, ngDataApi, $cookies, $localStorage) {
	$scope.$parent.isUserLoggedIn();
	$scope.access = {};
	$scope.selectedEnv = $scope.$parent.currentSelectedEnvironment.toUpperCase();
	var permissions = {
		"listTenants": ['urac', '/tenant/list', 'get']
	};
	constructModulePermissions($scope, $scope.access, permissions);
	
	$scope.listTenants = function () {
		overlayLoading.show();
		var opts = {
			"routeName": "/urac/tenant/list",
			"method": "get",
			"params": {
				"type": "admin",
				"negate": true
			}
		};
		getSendDataFromServer($scope, ngDataApi, opts, function (error, response) {
			overlayLoading.hide();
			if (error) {
				$scope.$parent.displayAlert('danger', error.code, true, 'dashboard', error.message);
			}
			else {
				for (var x = response.length - 1; x >= 0; x--) {
					if (response[x].type === 'admin') {
						response.splice(x, 1);
					}
				}
				$scope.tenants = response;
			}
		});
		
	};
	
	$scope.changeCode = function (tenant) {
		var newCode = tenant.code;
		if (newCode && newCode !== '') {
			var obj = {
				name: tenant.name,
				code: tenant.code,
				id: tenant._id || tenant.id
			};
			$scope.code = newCode.toString();
			$cookies.putObject('urac_merchant', obj, { 'domain': interfaceDomain });
			$scope.$parent.go('/urac-management/members');
		}
	};
	
	if ($scope.access.listTenants) {
		if ($cookies.getObject('urac_merchant', { 'domain': interfaceDomain }) && $cookies.getObject('urac_merchant', { 'domain': interfaceDomain }).code) {
			$scope.$parent.go('/urac-management/members');
		}
		else {
			$scope.listTenants();
		}
	}
	else {
		var user = $localStorage.soajs_user;
		$scope.changeCode(user.tenant);
	}
	
}]);

uracApp.controller('uracMembersModuleStgCtrl', ['$scope', '$cookies', '$localStorage', function ($scope, $cookies, $localStorage) {
	$scope.$parent.isUserLoggedIn();
	$scope.access = {};
	$scope.selectedEnv = $scope.$parent.currentSelectedEnvironment.toUpperCase();
	constructModulePermissions($scope, $scope.access, usersModuleStgConfig.permissions, $scope.selectedEnv);
	
	$scope.access.owner = {};
	var permissions = {
		"listTenants": ['urac', '/tenant/list', 'get']
	};
	constructModulePermissions($scope, $scope.access.owner, permissions);
	
	$scope.tName = $cookies.getObject('urac_merchant', { 'domain': interfaceDomain }).name;
	$scope.userCookie = $localStorage.soajs_user;
	$scope.backToList = function () {
		$cookies.remove('urac_merchant', { 'domain': interfaceDomain });
		$scope.$parent.go('/urac-management', { 'domain': interfaceDomain });
	};
}]);

uracApp.controller('tenantMembersModuleStgCtrl', ['$scope', 'ngDataApi', '$cookies', 'tenantMembersModuleStgHelper',
	function ($scope, ngDataApi, $cookies, tenantMembersModuleStgHelper) {
		$scope.startLimit = 0;
		$scope.totalCount = 0;
		$scope.endLimit = usersModuleStgConfig.apiEndLimit;
		$scope.keywords;
		
		$scope.members = angular.extend($scope);
		$scope.members.access = $scope.$parent.access;
		
		$scope.$parent.$on('reloadTenantMembers', function (event) {
			$scope.members.listMembers(true);
		});
		
		$scope.members.getMore = function (startLimit) {
			$scope.members.startLimit = startLimit;
			$scope.members.listMembers(false);
		};
		
		$scope.members.countMembers = function (cb) {
			var opts = {
				"method": "get",
				"routeName": "/urac/owner/admin/users/count",
				"proxy": true,
				"params": {
					"tenantCode": $cookies.getObject('urac_merchant', { 'domain': interfaceDomain }).code,
					"__env": $scope.members.currentSelectedEnvironment.toUpperCase()
				}
			};
			if ($scope.keywords) {
				opts.params.keywords = $scope.keywords;
			}
			getSendDataFromServer($scope.members, ngDataApi, opts, function (error, response) {
				if (error) {
					overlayLoading.hide();
					$scope.members.$parent.displayAlert("danger", error.code, true, 'urac', error.message);
				}
				else {
					$scope.members.totalCount = response.count;
					$scope.members.totalPagesActive = Math.ceil($scope.members.totalCount / $scope.endLimit);
				}
				cb();
			});
			
		};
		
		$scope.members.listMembers = function (firstCall) {
			if (firstCall) {
				$scope.members.pageActive = 1;
				$scope.members.countMembers(function () {
					tenantMembersModuleStgHelper.listMembers($scope.members, usersModuleStgConfig.users, firstCall);
				});
			}
			else {
				tenantMembersModuleStgHelper.listMembers($scope.members, usersModuleStgConfig.users, firstCall);
			}
			
		};
		
		$scope.members.refresh = function () {
			$scope.members.startLimit = 0;
			$scope.members.listMembers(true);
		};
		
		$scope.members.addMember = function () {
			tenantMembersModuleStgHelper.addMember($scope.members, usersModuleStgConfig.users, true);
		};
		
		$scope.members.editAcl = function (data) {
			//tenantMembersModuleStgHelper.editAcl($scope.members, data);
			$scope.members.$parent.go('/urac-management/' + data._id + '/editUserAcl');
		};
		
		$scope.members.editMember = function (data) {
			tenantMembersModuleStgHelper.editMember($scope.members, usersModuleStgConfig.users, data, true)
		};
		
		$scope.members.activateMembers = function () {
			tenantMembersModuleStgHelper.activateMembers($scope.members);
		};
		
		$scope.members.deactivateMembers = function () {
			tenantMembersModuleStgHelper.deactivateMembers($scope.members);
		};
		
		//call default method
		setTimeout(function () {
			if ($scope.members.access.adminUser.list) {
				$scope.members.listMembers(true);
			}
		}, 50);
		
	}]);

uracApp.controller('tenantGroupsModuleStgCtrl', ['$scope', '$cookies', 'tenantGroupsModuleStgHelper', function ($scope, $cookies, tenantGroupsModuleStgHelper) {
	$scope.groups = angular.extend($scope);
	$scope.groups.access = $scope.$parent.access;
	
	$scope.groups.listGroups = function () {
		tenantGroupsModuleStgHelper.listGroups($scope.groups, usersModuleStgConfig.groups);
	};
	
	$scope.groups.addGroup = function () {
		tenantGroupsModuleStgHelper.addGroup($scope.groups, usersModuleStgConfig.groups, true);
	};
	
	$scope.groups.editGroup = function (data) {
		tenantGroupsModuleStgHelper.editGroup($scope.groups, usersModuleStgConfig.groups, data, true);
	};
	
	$scope.groups.deleteGroups = function (data) {
		tenantGroupsModuleStgHelper.deleteGroups($scope.groups);
	};
	
	$scope.groups.delete1Group = function (data) {
		tenantGroupsModuleStgHelper.delete1Group($scope.groups, data, true);
	};
	
	$scope.groups.assignUsers = function (data) {
		tenantGroupsModuleStgHelper.assignUsers($scope.groups, usersModuleStgConfig.groups, data, {
			'name': 'reloadTenantMembers',
			params: {}
		});
	};
	
	setTimeout(function () {
		if ($scope.groups.access.adminGroup.list) {
			$scope.groups.listGroups();
		}
	}, 200);
	
}]);

uracApp.controller('tokensModuleStgCtrl', ['$scope', 'ngDataApi', '$cookies', 'tokensModuleStgHelper', function ($scope, ngDataApi, $cookies, tokensModuleStgHelper) {
	$scope.startLimit = 0;
	$scope.totalCount = 0;
	$scope.endLimit = usersModuleStgConfig.apiEndLimit;
	$scope.increment = usersModuleStgConfig.apiEndLimit;
	$scope.showNext = true;
	$scope.pageActive = 1;
	
	$scope.tokens = angular.extend($scope);
	$scope.tokens.access = $scope.$parent.access;
	
	$scope.getPrev = function () {
		$scope.tokens.startLimit = $scope.tokens.startLimit - $scope.tokens.increment;
		if (0 <= $scope.tokens.startLimit) {
			$scope.tokens.listTokens(false);
			$scope.tokens.showNext = true;
			$scope.tokens.pageActive--;
		}
		else {
			$scope.tokens.pageActive = 1;
			$scope.tokens.startLimit = 0;
		}
	};
	
	$scope.getNext = function () {
		var startLimit = $scope.tokens.startLimit + $scope.tokens.increment;
		if (startLimit < $scope.tokens.totalCount) {
			$scope.tokens.startLimit = startLimit;
			$scope.tokens.listTokens();
			$scope.tokens.pageActive++;
		}
		else {
			$scope.tokens.showNext = false;
		}
	};
	
	$scope.getEnd = function () {
		var startLimit = ($scope.tokens.totalPagesActive - 1) * $scope.tokens.endLimit;
		if (startLimit < $scope.tokens.totalCount) {
			$scope.tokens.startLimit = startLimit;
			$scope.tokens.listTokens();
			$scope.tokens.pageActive = $scope.tokens.totalPagesActive;
		}
		else {
			$scope.tokens.showNext = false;
		}
	};
	
	$scope.tokens.listTokens = function (firstCall) {
		if (firstCall) {
			$scope.tokens.startLimit = 0;
			$scope.tokens.pageActive = 1;
		}
		tokensModuleStgHelper.listTokens($scope.tokens, tokensModuleStgConfig, firstCall);
	};
	
	$scope.tokens.deleteTokens = function () {
		tokensModuleStgHelper.deleteTokens($scope.tokens);
	};
	
	$scope.tokens.delete1Token = function (data) {
		tokensModuleStgHelper.delete1Token($scope.tokens, data, true);
	};
	
	setTimeout(function () {
		if ($scope.tokens.access.adminUser.list) {
			$scope.tokens.listTokens(true);
		}
	}, 200);
	
}]);

uracApp.controller('uracAclModuleStgCtrl', ['$scope', '$routeParams', 'ngDataApi', '$cookies', 'memAclModuleStgHelper', '$route', '$localStorage',
	function ($scope, $routeParams, ngDataApi, $cookies, memAclModuleStgHelper, $route, $localStorage) {
		$scope.$parent.isUserLoggedIn();
		$scope.msg = {};
		$scope.user = {};
		$scope.tenantApp = {};
		$scope.allGroups = [];
		$scope.pckName = '';
		$scope.environments_codes = [];
		$scope.uracModuleStg = uracModuleStg;
		
		var tCode = $cookies.getObject('urac_merchant', { 'domain': interfaceDomain }).code;
		$scope.selectedEnv = $scope.$parent.currentSelectedEnvironment.toUpperCase();
		$scope.userCookie = $localStorage.soajs_user;
		
		$scope.minimize = function (application, service, oneEnv) {
			application.aclFill[oneEnv][service.name].collapse = true;
		};
		
		$scope.expand = function (application, service, oneEnv) {
			application.aclFill[oneEnv][service.name].collapse = false;
		};
		//TODO: need more work
		$scope.selectService = function (application, service, oneEnv) {
			if (application.aclFill[oneEnv][service.name]) {
				if (application.aclFill[oneEnv][service.name].include) {
					if (application.aclFill[oneEnv][service.name].forceRestricted) {
						application.aclFill[oneEnv][service.name].apisRestrictPermission = true;
					}
					application.aclFill[oneEnv][service.name].collapse = false;
				}
				else {
					application.aclFill[oneEnv][service.name].collapse = true;
				}
			}
		};
		
		$scope.getUserAclInfo = function () {
			
			function getUserGroupInfo(cb) {
				var opts = {
					"method": "get",
					"proxy": true,
					"routeName": "/urac/owner/admin/getUser",
					"params": {
						"uId": $routeParams.uId,
						"tenantCode": tCode,
						"__env": $scope.selectedEnv
					}
				};
				getSendDataFromServer($scope, ngDataApi, opts, function (error, response) {
					if (error) {
						overlayLoading.hide();
						$scope.$parent.displayAlert('danger', error.code, true, 'urac', error.message);
					}
					else {
						$scope.user = response;
						getSendDataFromServer($scope, ngDataApi, {
							"method": "get",
							"proxy": true,
							"routeName": "/urac/owner/admin/group/list",
							"params": {
								"tenantCode": tCode,
								"__env": $scope.selectedEnv
							}
						}, function (error, response) {
							overlayLoading.hide();
							if (error) {
								if (error.code !== 159) {
									$scope.$parent.displayAlert("danger", error.code, true, 'urac', error.message);
								}
							}
							if (response) {
								response.forEach(function (grpObj) {
									$scope.allGroups.push(grpObj.code);
								});
							}
							cb();
						});
					}
				});
			}
			
			getUserGroupInfo(function () {
				getSendDataFromServer($scope, ngDataApi, {
					"method": "get",
					"proxy": true,
					"routeName": "/urac/tenant/getUserAclInfo",
					"params": {
						"tenantId": $cookies.getObject('urac_merchant', { 'domain': interfaceDomain }).id
					}
				}, function (error, response) {
					if (error) {
						overlayLoading.hide();
						$scope.$parent.displayAlert('danger', error.code, true, 'dashboard', error.message);
					}
					else {
						$scope.environments_codes = response.environment;
						$scope.tenantApp = response.tenant;
						$scope.tenantApp.services = response.services;
						
						var apps = [];
						for (var j = $scope.tenantApp.applications.length - 1; 0 <= j; j--) {
							if (apps.indexOf($scope.tenantApp.applications[j].package) === -1) {
								apps.push($scope.tenantApp.applications[j].package);
							}
							else {
								$scope.tenantApp.applications.splice(j, 1);
							}
						}
						
						$scope.tenantApp.applications.forEach(function (oneApplication) {
							if ($scope.user.config && $scope.user.config.packages && $scope.user.config.packages[oneApplication.package]) {
								if ($scope.user.config.packages[oneApplication.package].acl) {
									oneApplication.userPackageAcl = angular.copy($scope.user.config.packages[oneApplication.package].acl);
								}
							}
							memAclModuleStgHelper.renderPermissionsWithServices($scope, oneApplication);
							overlayLoading.hide();
						});
					}
				});
			});
		};
		
		$scope.openApi = function (application, serviceName, oneEnv) {
			var status = false;
			for (var oneService in application.aclFill[oneEnv]) {
				if (oneService === serviceName) {
					if (application.aclFill[oneEnv][oneService].include && !application.aclFill[oneEnv][oneService].collapse) {
						status = true;
					}
				}
			}
			return status;
		};
		
		$scope.checkForGroupDefault = function (aclFill, service, grp, val, myApi) {
			memAclModuleStgHelper.checkForGroupDefault(aclFill, service, grp, val, myApi);
		};
		
		$scope.applyRestriction = function (aclFill, service) {
			memAclModuleStgHelper.applyRestriction(aclFill, service);
		};
		
		$scope.clearUserAcl = function () {
			var postData = $scope.user;
			
			if (typeof(postData.config) === 'object') {
				if (typeof(postData.config.packages) === 'object') {
					$scope.tenantApp.applications.forEach(function (oneApplication) {
						if (postData.config.packages[oneApplication.package]) {
							if (postData.config.packages[oneApplication.package].acl) {
								delete postData.config.packages[oneApplication.package].acl;
							}
						}
					});
				}
				else {
					postData.config.packages = {};
				}
			}
			else {
				postData.config = {};
			}
			
			overlayLoading.show();
			var opts = {
				"method": "send",
				"routeName": "/urac/owner/admin/editUserConfig",
				"proxy": true,
				"params": {
					"tenantCode": tCode,
					"__env": $scope.selectedEnv,
					"uId": $scope.user['_id']
				},
				"data": postData
			};
			
			getSendDataFromServer($scope, ngDataApi, opts, function (error) {
				overlayLoading.hide();
				if (error) {
					$scope.$parent.displayAlert('danger', error.code, true, 'urac', error.message);
				}
				else {
					$scope.msg.type = '';
					$scope.msg.msg = '';
					$scope.$parent.displayAlert('success', translation.userAclDeletedSuccessfully[LANG]);
					$route.reload();
				}
			});
		};
		
		$scope.saveUserAcl = function () {
			var postData = $scope.user;
			if (typeof(postData.config) === 'object') {
				if (typeof(postData.config.packages) !== 'object') {
					postData.config.packages = {};
				}
			}
			else {
				postData.config = {
					packages: {}
				};
			}
			
			var counter = 0;
			var appsDone = [];
			$scope.tenantApp.applications.forEach(function (oneApplication) {
				var tmpObj = {
					'services': oneApplication.aclFill
				};
				var result = memAclModuleStgHelper.prepareAclObjToSave(tmpObj);
				if (result.valid) {
					var packageName = oneApplication.package;
					if (!postData.config.packages[packageName]) {
						postData.config.packages[packageName] = {};
					}
					if (!postData.config.packages[packageName].acl) {
						postData.config.packages[packageName].acl = {};
					}
					if (appsDone.indexOf(packageName) === -1) {
						postData.config.packages[packageName].acl = result.data;
					}
					
					appsDone.push(packageName);
					counter++;
				}
				else {
					$scope.$parent.displayAlert('danger', translation.needToChooseGroupAccessTypeSetGroups[LANG]);
				}
			});
			
			if (counter === $scope.tenantApp.applications.length) {
				overlayLoading.show();
				var opts = {
					"method": "send",
					"routeName": "/urac/owner/admin/editUserConfig",
					"proxy": true,
					"params": {
						"tenantCode": tCode,
						"__env": $scope.selectedEnv,
						"uId": $scope.user['_id']
					},
					"data": postData
				};
				
				getSendDataFromServer($scope, ngDataApi, opts, function (error) {
					overlayLoading.hide();
					if (error) {
						$scope.$parent.displayAlert('danger', error.code, true, 'urac', error.message);
					}
					else {
						$scope.msg.type = '';
						$scope.msg.msg = '';
						$scope.$parent.displayAlert('success', translation.ACLUpdatedSuccessfully[LANG]);
					}
				});
			}
		};
		//call default method
		overlayLoading.show(function () {
			$scope.getUserAclInfo();
		});
	}]);