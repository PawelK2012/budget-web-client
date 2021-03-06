(function() {
    'use strict';

    angular.module('myApp.viewbudget', ['ngRoute', 'firebase', 'googlechart'])

    .config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/viewbudget/:itemId', {
            restrict: 'E',
            templateUrl: 'views/budget/viewbudget.partial.html',
            controller: 'ViewbudgetCtrl',
            controllerAs: 'vm',
            bindToController: true,
            resolve: {
                getRequireAuth: function(authenticationService) {
                    return authenticationService.getRequireAuth();
                }
            }
        });
    }])

    .controller('ViewbudgetCtrl', ViewbudgetCtrl);

    ViewbudgetCtrl.$inject = ['$routeParams', '$scope', 'budgetService']

    function ViewbudgetCtrl($routeParams, $scope, budgetService) {

        var vm = this;
        vm.budgetId = $routeParams.itemId;
        vm.currentBudget = budgetService.getBudgetByKey(vm.budgetId);
        vm.currency = $scope.currentUser.currency.alias;
        vm.updateBudgetTitle = updateBudgetTitle;
        vm.addExpense = addExpense;
        vm.deleteExpense = deleteExpense;
        vm.addIncomeToBudget = addIncomeToBudget;
        vm.deleteIncome = deleteIncome;
        vm.createChart = createChart;
        vm.updateChart = updateChart;
        createChart();

        function updateBudgetTitle(id, title) {
            budgetService.updateBudgetTitle(id, title);
        }

        function addExpense(id, expenseName, expenseCategory, expenseCost, expenseType) {
            budgetService.addExpense(id, expenseName, expenseCategory, expenseCost, expenseType);
            vm.extraExpense = false;
            vm.monthlyExpense = false;
            vm.sucessfullyAddedMsg = true;
            updateChart();
        }

        function deleteExpense(key, expenseType) {
            budgetService.deleteExpense(key, expenseType, vm.budgetId);
            createChart();
        }

        function addIncomeToBudget(incomeName, incomeAmout, budgetId) {
            budgetService.addIncomeToCurrentBallance(incomeAmout, vm.currentBudget.currentBalance, budgetId, incomeName);
            vm.addIncome = false;
            vm.sucessfullyAddedMsg = true;
            updateChart();
        }

        function deleteIncome(key) {
            budgetService.deleteIncome(key, vm.budgetId);
        }

        function createChart() {

            $scope.chartObject = {};

            $scope.chartObject.type = "PieChart";

            $scope.PieChartCurrentBalance = [
                { v: "Current founds" },
                { v: vm.currentBudget.currentBalance },
            ];
            $scope.chartObject.options = {
                title: 'Start balance: ' + vm.currentBudget.firstDayBalance + " " + vm.currency,
                titleTextStyle: { color: '#4A148C', fontSize: 18},
                backgroundColor: '#F5F5F5',
                chartArea: { left: 0, top: 32, width: '100%', height: '100%' }
            };
            updateChart();
        }

        function updateChart() {
            $scope.chartObject.data = {
                "cols": [
                    { id: "t", label: "Topping", type: "string" },
                    { id: "s", label: "Slices", type: "number" }
                ],
                "rows": [{
                        c: [
                            { v: "Extra expenses" },
                            { v: vm.currentBudget.totalExpenses },
                        ]
                    },
                    { c: $scope.PieChartCurrentBalance }, {
                        c: [
                            { v: "Planed expenses" },
                            { v: vm.currentBudget.totalMonthlyExpenses },

                        ]
                    }
                ]
            };
        }
    };


})();
