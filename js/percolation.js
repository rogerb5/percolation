class WeightedQuickUnion {
    constructor(n) {
        this.count = n;
        this.parent = new Array(n);
        this.size = new Array(n);
        for (let index = 0; index < n; index++) {
            this.parent[index] = index;
            this.size[index] = 1;
        }
    }

    getCount() {
        return this.count;
    }

    find(p) {
        this.validate(p);
        while (p !== this.parent[p]) {
            p = this.parent[p];
        }
        return p;
    }

    connected(p, q) {
        const rootP = this.find(p);
        const rootQ = this.find(q);
        const result = rootP === rootQ;
        console.log(
            `Connected check between ${p} (root: ${rootP}) and ${q} (root: ${rootQ}): ${result}`
        );
        return result;
    }

    validate(p) {
        const n = this.parent.length;
        if (p < 0 || p >= n) {
            throw new Error(`Index ${p} is not between ${n - 1}`);
        }
    }

    union(p, q) {
        const rootP = this.find(p);
        const rootQ = this.find(q);
        console.log(`Union(${p}, ${q}), (root: ${rootP}, root: ${rootQ})`);
        if (rootP === rootQ) {
            console.log(
                `No union needed. ${p} and ${q} are already in the same set.`
            );
            return;
        }
        if (this.size[rootP] < this.size[rootQ]) {
            this.parent[rootP] = rootQ;
            this.size[rootQ] += this.size[rootP];
        } else {
            this.parent[rootQ] = rootP;
            this.size[rootP] += this.size[rootQ];
        }
        this.count--;
    }
}

class Percolation extends WeightedQuickUnion {
    constructor(n) {
        super(n);
        this.length = n;
        this.dimensions = n * n;
        this.virtualTop = this.dimensions * 0;
        this.virtualBottom = this.dimensions + 1;
        this.sourceConnector = new WeightedQuickUnion(this.dimensions + 2);
        this.sinkConnector = new WeightedQuickUnion(this.dimensions + 2);
        this.world = Array(this.dimensions).fill(false);
        this.numberOfOpenCells = 0;
    }

    generateGrid(n) {
        const gridContainer = document.querySelector("main.container");
        gridContainer.style.gridTemplateColumns = `repeat(${n}, minmax(5rem, 1fr))`;
        gridContainer.style.gridTemplateRows = `repeat(${n}, minmax(5rem, 1fr))`;
        for (let row = 0; row < n; row++) {
            for (let col = 0; col < n; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                // cell.textContent = `(${row}, ${col})`;
                gridContainer.appendChild(cell);
            }
        }
    }

    addCellClickListners(n) {
        const container = document.querySelector("main.container");
        const cells = container.querySelectorAll("div.cell");
        const openCellsOutput = document.querySelector("h3.open-sites-output");
        cells.forEach((cell, index) => {
            cell.addEventListener("click", () => {
                let row = Math.floor(index / n);
                let col = index % n;
                if (!this.isOpen(row, col, cell)) {
                    this.openSpace(row, col, cell);
                } else {

                }
                openCellsOutput.textContent = `${this.getNumberOfOpenSites()} open sites`;
            });
        });
    }

    isValidIndex(row, col) {
        if (row < 0 || row > this.length - 1 || col < 0 || col > this.length - 1) {
            throw new Error("Index out of Range");
        }
    }

    XYto1D(row, col) {
        return row * this.length + col + 1;
    }

    isOpen(row, col) {
        this.isValidIndex(row, col);
        return this.world[this.XYto1D(row, col) - 1];
    }

    openSpace(row, col, cell) {
        const index = this.XYto1D(row, col);
        this.world[index - 1] = true;
        this.numberOfOpenCells++;
        console.log(`tile ${index} was opened`)

        this.isValidIndex(row, col);
        const topNeighbor = row - 1;
        const bottomNeighbor = row + 1;
        const leftNeighbor = col - 1;
        const rightNeighbor = col + 1;

        if (row === 0) {
            this.connect(this.XYto1D(row, col), this.virtualTop);
            cell.classList.add("filled");
        }

        if (row === this.length - 1) {
            this.sinkConnector.union(this.XYto1D(row, col), this.virtualBottom);
        }

        if (topNeighbor >= 0 && this.isOpen(topNeighbor, col)) {
            this.connect(this.XYto1D(row, col), this.XYto1D(topNeighbor, col));
        }

        if (bottomNeighbor < this.length && this.isOpen(bottomNeighbor, col)) {
            this.connect(this.XYto1D(row, col), this.XYto1D(bottomNeighbor, col));
        }

        if (leftNeighbor >= 0 && this.isOpen(row, leftNeighbor)) {
            this.connect(this.XYto1D(row, col), this.XYto1D(row, leftNeighbor));
        }

        if (rightNeighbor < this.length && this.isOpen(row, rightNeighbor)) {
            this.connect(this.XYto1D(row, col), this.XYto1D(row, rightNeighbor));
        }

        if (this.isFull(row, col)) {
            cell.classList.add("filled");
        } else if (this.isOpen(row, col) && !this.isFull(row, col)) {
            cell.classList.add("open");
        } else {
            cell.classList.replace("open", "filled");
        }

        if (this.doesPercolate()) {
            const percolateOutput = document.querySelector("h3.percolate-output");
            percolateOutput.textContent = "Does percolate";
        }

        this.updateVisualization();
    }

    checkAndFill(row, col) {
        const index = this.XYto1D(row, col);
        // Check if the cell is open and not filled
        if (this.isOpen(row, col) && !this.world[index - 1]) {
            const currentSet = this.sourceConnector.find(index);
            const cell = document.querySelector(`.cell:nth-child(${index})`);
            // Check if the current set is connected to the virtual top
            if (this.sourceConnector.connected(currentSet, this.virtualTop)) {
                cell.classList.replace("open", "filled");
                this.world[index - 1] = true;
            }
        }
    }

    updateVisualization() {
        for (let i = 1; i <= this.dimensions; i++) {
            const cell = document.querySelector(`.cell:nth-child(${i})`);
            const index = i - 1;
            if (this.world[index]) {
                if (this.isFullByIndex(index)) {
                    cell.classList.replace("open", "filled");
                } else {
                    cell.classList.add("open");
                }
            } else {
                cell.classList.remove("open", "filled");
            }
        }
    }

    isFullByIndex(index) {
        const row = Math.floor(index / this.length);
        const col = index % this.length;
        return this.isFull(row, col);
    }

    connect(row, col) {
        this.sourceConnector.union(row, col);
        this.sinkConnector.union(row, col);
    }

    isFull(row, col) {
        this.isValidIndex(row, col);
        const index = this.XYto1D(row, col);
        if (row === this.length - 1) {
            return this.sourceConnector.connected(index, this.virtualTop);
        }
        return this.sourceConnector.connected(
            this.XYto1D(row, col),
            this.virtualTop
        );
    }

    getDimensions() {
        return this.dimensions;
    }

    getNumberOfOpenSites() {
        return this.numberOfOpenCells;
    }

    doesPercolate() {
        return this.sinkConnector.connected(this.virtualTop, this.virtualBottom);
    }
}

export { WeightedQuickUnion, Percolation };

// set up grid and event listeners
const testGrid = new Percolation(8);
testGrid.generateGrid(8);
testGrid.addCellClickListners(8);