/**
 * Solver methods attached to SudokuEngine.
 * Loaded after js/sudoku.js
 */

SudokuEngine.prototype.solve = function(board, isXSudoku = false) {
        for (let i = 0; i < 81; i++) {
            if (board[i] === 0) {
                const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                for (let num of nums) {
                    if (this.isValid(board, i, num, isXSudoku)) {
                        board[i] = num;
                        if (this.solve(board, isXSudoku)) return true;
                        board[i] = 0;
                    }
                }
                return false;
            }
        }
        return true;
};

SudokuEngine.prototype.findLogicStep = function(currentGrid, solution) {
        for (let i = 0; i < 81; i++) {
            if (currentGrid[i] === 0) {
                const candidates = [];
                for (let num = 1; num <= 9; num++) {
                    if (this.isValid(currentGrid, i, num)) {
                        candidates.push(num);
                    }
                }
                if (candidates.length === 1) {
                    const row = Math.floor(i / 9) + 1;
                    const col = (i % 9) + 1;
                    return {
                        index: i,
                        val: candidates[0],
                        type: 'Naked Single',
                        msg: `At Row ${row}, Col ${col}, only number <strong>${candidates[0]}</strong> is valid based on existing row, column, and 3x3 box rules.`
                    };
                }
            }
        }
        for (let i = 0; i < 81; i++) {
            if (currentGrid[i] === 0) {
                const row = Math.floor(i / 9) + 1;
                const col = (i % 9) + 1;
                return {
                    index: i,
                    val: solution[i],
                    type: 'Direct Deduction',
                    msg: `Analyzing cell at Row ${row}, Col ${col} proves that number <strong>${solution[i]}</strong> fits perfectly.`
                };
            }
        }
        return null;
};
