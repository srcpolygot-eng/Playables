class SudokuEngine {
    constructor() {
        this.board = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.initial = Array(81).fill(0);
        this.cages = [];
        this.linkedPairs = [];
    }

    isValid(board, index, num, isXSudoku = false) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;

        for (let i = 0; i < 9; i++) {
            if (board[row * 9 + i] === num && (row * 9 + i) !== index) return false;
            if (board[i * 9 + col] === num && (i * 9 + col) !== index) return false;
            const r = boxRow + Math.floor(i / 3);
            const c = boxCol + (i % 3);
            if (board[r * 9 + c] === num && (r * 9 + c) !== index) return false;
        }

        if (isXSudoku) {
            if (row === col) {
                for (let i = 0; i < 9; i++) {
                    if (board[i * 9 + i] === num && (i * 9 + i) !== index) return false;
                }
            }
            if (row + col === 8) {
                for (let i = 0; i < 9; i++) {
                    if (board[i * 9 + (8 - i)] === num && (i * 9 + (8 - i) !== index) === false);
                }
            }
        }

        return true;
    }

    fillBox(board, startRow, startCol) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        let idx = 0;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                board[(startRow + r) * 9 + (startCol + c)] = nums[idx++];
            }
        }
    }

    generate(difficulty = 'medium', mode = 'classic') {
        const isXSudoku = mode === 'xsudoku';
        this.board = Array(81).fill(0);

        this.fillBox(this.board, 0, 0);
        this.fillBox(this.board, 3, 3);
        this.fillBox(this.board, 6, 6);

        this.solve(this.board, isXSudoku);
        this.solution = [...this.board];

        let cluesCount = 38;
        if (difficulty === 'easy') cluesCount = 48;
        else if (difficulty === 'medium') cluesCount = 38;
        else if (difficulty === 'hard') cluesCount = 32;
        else if (difficulty === 'expert') cluesCount = 28;
        else if (difficulty === 'master') cluesCount = 24;
        else if (difficulty === 'paradox') cluesCount = 20;

        const indices = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
        let removed = 0;
        const targetToRemove = 81 - cluesCount;

        for (let idx of indices) {
            if (removed >= targetToRemove) break;
            this.board[idx] = 0;
            removed++;
        }

        this.initial = [...this.board];

        if (mode === 'killer') {
            this.generateKillerCages();
        } else if (mode === 'alpha') {
            this.generateLinkedPairs();
        }

        return {
            puzzle: [...this.board],
            solution: [...this.solution],
            cages: this.cages,
            linkedPairs: this.linkedPairs
        };
    }

    generateKillerCages() {
        this.cages = [];
        const visited = Array(81).fill(false);
        let cageId = 1;

        for (let i = 0; i < 81; i++) {
            if (visited[i]) continue;
            const cageSize = Math.floor(Math.random() * 2) + 2;
            const cageCells = [i];
            visited[i] = true;

            for (let s = 1; s < cageSize; s++) {
                const lastCell = cageCells[cageCells.length - 1];
                const row = Math.floor(lastCell / 9);
                const col = lastCell % 9;
                const neighbors = [];

                if (row > 0 && !visited[(row - 1) * 9 + col]) neighbors.push((row - 1) * 9 + col);
                if (row < 8 && !visited[(row + 1) * 9 + col]) neighbors.push((row + 1) * 9 + col);
                if (col > 0 && !visited[row * 9 + (col - 1)]) neighbors.push(row * 9 + (col - 1));
                if (col < 8 && !visited[row * 9 + (col + 1)]) neighbors.push(row * 9 + (col + 1));

                if (neighbors.length > 0) {
                    const nextCell = neighbors[Math.floor(Math.random() * neighbors.length)];
                    visited[nextCell] = true;
                    cageCells.push(nextCell);
                } else break;
            }

            const sum = cageCells.reduce((acc, cellIdx) => acc + this.solution[cellIdx], 0);
            this.cages.push({ id: cageId++, cells: cageCells, sum: sum });
        }
    }

    generateLinkedPairs() {
        this.linkedPairs = [];
        for (let k = 0; k < 4; k++) {
            const idx1 = Math.floor(Math.random() * 40);
            const idx2 = 80 - idx1;
            this.linkedPairs.push([idx1, idx2]);
        }
    }

}
