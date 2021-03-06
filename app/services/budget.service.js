(function() {
    'use strict';

    angular
        .module('myApp')
        .factory('budgetService', budgetService);

    function budgetService($rootScope, $firebase, $firebaseArray, $firebaseObject, $location) {
        var FIREBASE_URL = new Firebase('https://budget-db-app.firebaseio.com/');
        var ref = new Firebase(FIREBASE_URL + '/users/' + $rootScope.currentUser.$id + '/budgets');
        var budgetsArray = $firebaseArray(ref);
        var budgetsObject = $firebaseObject(ref);
        var allBudgets = [];
        var totalExpenses = 0;
        var currentBalance = 0;
        var currentBudgetById = {};
        var currentBudgetByKey = [];

        var service = {
            setNewBudget: setNewBudget,
            updateBudgetTitle: updateBudgetTitle,
            addExpense: addExpense,
            getAllBudgets: getAllBudgets,
            getBudgetById: getBudgetById,
            getBudgetByKey: getBudgetByKey,
            deleteBudget: deleteBudget,
            deleteExpense: deleteExpense,
            duplicateBudget: duplicateBudget,
            calculateTotalExpenses: calculateTotalExpenses,
            calculateCurrentBalance: calculateCurrentBalance,
            addIncomeToCurrentBallance: addIncomeToCurrentBallance,
            deleteIncome: deleteIncome,
            calculateTotalExtraIncomes: calculateTotalExtraIncomes
        };

        return service;

        function setNewBudget(budgetTitle, startDate, endDate, startingBudget, expenses, monthlyExpenses, totalExpenses, totalMonthlyExpenses) {
            budgetsArray.$add({
                from: $rootScope.currentUser.firstname,
                title: budgetTitle,
                budgetStartDate: startDate.toDateString(),
                budgetEndDate: endDate.toDateString(),
                expenses: expenses,
                monthlyExpenses: monthlyExpenses,
                totalExpenses: totalExpenses,
                totalMonthlyExpenses: totalMonthlyExpenses,
                firstDayBalance: startingBudget,
                lastDayBalance: 0,
                totalIncomes: 0,
                currentBalance: startingBudget - totalExpenses - totalMonthlyExpenses,
                timestamp: Firebase.ServerValue.TIMESTAMP
            }).then(function(ref) {
                var id = ref.key();
                $location.path('/viewbudget/' + budgetsArray.$indexFor(id));
            });
        }

        function duplicateBudget(id) {
            console.log(id, "inside")
            var budgetToBeDuplicated = getBudgetByKey(id);
            console.log(budgetToBeDuplicated)

            budgetsArray.$add({
                from: $rootScope.currentUser.firstname,
                title: budgetToBeDuplicated.title + " DUPLICATED",
                budgetStartDate: budgetToBeDuplicated.budgetStartDate,
                budgetEndDate: budgetToBeDuplicated.budgetEndDate,
                expenses: budgetToBeDuplicated.expenses || [],
                monthlyExpenses: budgetToBeDuplicated.monthlyExpenses || [],
                extraIncomes: budgetToBeDuplicated.extraIncomes || [],
                totalExpenses: budgetToBeDuplicated.totalExpenses,
                totalMonthlyExpenses: budgetToBeDuplicated.totalMonthlyExpenses,
                firstDayBalance: budgetToBeDuplicated.firstDayBalance,
                lastDayBalance: budgetToBeDuplicated.lastDayBalance,
                totalIncomes: budgetToBeDuplicated.totalIncomes || 0,
                totalExpenses: budgetToBeDuplicated.totalExpenses,
                currentBalance: budgetToBeDuplicated.currentBalance,
                timestamp: Firebase.ServerValue.TIMESTAMP
            }).then(function(ref) {
                var id = ref.key();
                $location.path('/viewbudget/' + budgetsArray.$indexFor(id));
            });
        }

        function updateBudgetTitle(id, budgetTitle) {
            var udpdatedBudget = budgetsArray[id];
            udpdatedBudget.title = budgetTitle;
            budgetsArray.$save(udpdatedBudget).then(function(ref) {
                // Do something
            });
        }

        function addExpense(id, expenseName, expenseCategory, expenseCost, expenseType) {
            var udpdatedBudget = budgetsArray[id];
            var staBudget = udpdatedBudget.firstDayBalance;
            var totalMonExpe = udpdatedBudget.totalMonthlyExpenses;
            var totalExtraExpe = udpdatedBudget.totalExpenses;
            // We need to check what type of expense to be added
            if (expenseType === "monthly") {

                var expensesArray = udpdatedBudget.monthlyExpenses;
                // Check if monthlyExpenses[] exist in updadeBudget 
                if (!expensesArray) {
                    expensesArray = [];
                }
                var expense = {
                    name: expenseName,
                    category: expenseCategory,
                    cost: expenseCost
                };
                expensesArray.push(expense);
                var newTotalmonthlyExpenses = calculateTotalExpenses(expensesArray);
                var calcNewBallance = calculateCurrentBalance(staBudget, totalExtraExpe, newTotalmonthlyExpenses);
                // Edit values
                udpdatedBudget.totalMonthlyExpenses = newTotalmonthlyExpenses;
                udpdatedBudget.monthlyExpenses = expensesArray;
                udpdatedBudget.currentBalance = calcNewBallance;

            } else if (expenseType === "extra") {

                var expensesArray = udpdatedBudget.expenses;

                // Check if epxenses[] exist in updadeBudget 
                if (!expensesArray) {
                    expensesArray = [];
                }
                var expense = {
                    name: expenseName,
                    category: expenseCategory,
                    cost: expenseCost
                };
                expensesArray.push(expense);
                var newTotalExtraExpenses = calculateTotalExpenses(expensesArray);
                var newBallance = calculateCurrentBalance(staBudget, totalMonExpe, newTotalExtraExpenses);
                // Edit values
                udpdatedBudget.totalExpenses = newTotalExtraExpenses;
                udpdatedBudget.expenses = expensesArray;
                udpdatedBudget.currentBalance = newBallance;

            }

            budgetsArray.$save(udpdatedBudget).then(function(ref) {
                // Do something
            });
        }

        function addIncomeToCurrentBallance(incomeAmout, ballance, budgetId, incomeName) {
            var budgetToBeUpdated = budgetsArray[budgetId];
            var extraIncomes = budgetToBeUpdated.extraIncomes;
            if (!extraIncomes) {
                extraIncomes = [];
            }
            var income = {
                name: incomeName,
                amount: incomeAmout
            }
            extraIncomes.push(income);
            budgetToBeUpdated.totalIncomes = calculateTotalExtraIncomes(extraIncomes);
            budgetToBeUpdated.extraIncomes = extraIncomes;
            budgetToBeUpdated.currentBalance = incomeAmout + ballance;
            budgetsArray.$save(budgetToBeUpdated);
        }

        function getAllBudgets() {
            // Download the data from a Firebase reference into a (pseudo read-only) array
            // all server changes are applied in realtime
            var allBudgets = $firebaseArray(ref);
            allBudgets.$loaded()
                .then(function(x) {
                    x === allBudgets; // true
                })
                .catch(function(error) {
                    console.log("Error:", error);
                });

            return allBudgets;
        }

        function getBudgetById(id) {
            // Returns firebaseObject of selected budget
            return currentBudgetById = budgetsObject[id];
        }

        function getBudgetByKey(id) {
            // Returns an single item from $FirebaseArray
            return currentBudgetByKey = budgetsArray[id];
        }

        function deleteBudget(key) {
            budgetsArray.$remove(key);
        }

        function deleteExpense(key, expenseType, budgetId) {
            var budget = budgetsArray[budgetId];
            var currentBalance = budget.currentBalance;

            // We need to check what type of expense to be deleted
            if (expenseType === "monthly") {

                var tmpExpenses = budgetsArray[budgetId].monthlyExpenses;
                var monthlyExpenseCost = budgetsArray[budgetId].monthlyExpenses[key].cost;
                tmpExpenses.splice(key, 1);
                var total = calculateTotalExpenses(tmpExpenses);
                budget.monthlyExpenses = tmpExpenses;
                budget.totalMonthlyExpenses = total;
                budget.currentBalance = currentBalance - monthlyExpenseCost;

            } else if (expenseType === "extra") {

                var tmpExpenses = budgetsArray[budgetId].expenses;
                var expenseCost = budgetsArray[budgetId].expenses[key].cost;
                tmpExpenses.splice(key, 1);
                var total = calculateTotalExpenses(tmpExpenses);
                budget.expenses = tmpExpenses;
                budget.totalExpenses = total;
                budget.currentBalance = currentBalance - expenseCost;

            }
            budgetsArray.$save(budget);
        }

        function deleteIncome(key, budgetId) {
            var budget = budgetsArray[budgetId];
            var currentBalance = budget.currentBalance;
            var extraIncomes = budget.extraIncomes;
            var deletedIncome = extraIncomes[key].amount;
            extraIncomes.splice(key, 1);
            budget.totalIncomes = calculateTotalExtraIncomes(extraIncomes);
            budget.extraIncomes = extraIncomes;
            budget.currentBalance = currentBalance - deletedIncome;
            budgetsArray.$save(budget);
        }

        function calculateTotalExpenses(expenses) {
            var totalExpenses = 0;
            for (var i = 0; i < expenses.length; i++) {
                var expense = expenses[i].cost;
                totalExpenses = totalExpenses + expense;
            }
            return totalExpenses;
        }

        function calculateTotalExtraIncomes(incomes) {
            var totalIncomes = 0;
            for (var i = 0; i < incomes.length; i++) {
                var income = incomes[i].amount;
                totalIncomes = totalIncomes + income;
            }
            return totalIncomes;
        }

        function calculateCurrentBalance(staBudget, totalExtraExpen, totalMonExpe) {
            var expenses = totalExtraExpen + totalMonExpe;
            currentBalance = staBudget - expenses;
            return currentBalance;
        }
    }
})();
