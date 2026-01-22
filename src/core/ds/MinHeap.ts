export interface PriorityQueueItem<T> {
  priority: number;
  value: T;
}

export class MinHeap<T> {
  private heap: PriorityQueueItem<T>[] = [];

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): T | undefined {
    return this.heap.length > 0 ? this.heap[0].value : undefined;
  }

  private getParentIndex(index: number): number {
    return Math.floor((index - 1) / 2);
  }

  private getChildIndex(index: number): [number, number] {
    const subChild = index*2;
    return [subChild+1, subChild+2];
  }

  private swap(indexA: number, indexB: number): void {
    [this.heap[indexA], this.heap[indexB]] = [this.heap[indexB], this.heap[indexA]];
  }

  public push(value: T, priority: number): void {
    const newNode = { priority, value };
    this.heap.push(newNode);
    this.bubbleUp(this.heap.length - 1);
  }


  public pop(): T | undefined {
    if (this.isEmpty()) {return undefined;}

    const val = this.heap[0].value;     //get root val
    this.swap(0, this.size()-1);    //swap with last
    this.heap.pop();
    this.sinkDown(0);
    return val; 
  }

  // Used for inserting new elements, index looping to save on memory
  private bubbleUp(index: number): void {
    while (index > 0 ) {
        const parent = this.getParentIndex(index);  // 1 fn call optimisation

        if (this.heap[index].priority < this.heap[parent].priority) {
            this.swap(index, parent);
            index = parent;
        } else {
            break;
        }   
    }
  }


 /* 
  // Recursive implementation
  private bubbleUp(index: number): void {
    if (index === 0) {return;}

    const parent = this.getParentIndex(index);  // 1 fn call optimisation
    
    if (this.heap[index].priority < this.heap[parent].priority) {
        this.swap(index, parent);

        this.bubbleUp(parent);  //recursive call
    }
  }
*/

  private sinkDown(index: number): void {
    const length = this.size()    //opt 1 fn call

    while (index < length) {
        let smallest = index;       //assume that index is smallest initially
        const [lhs, rhs] = this.getChildIndex(index);

        if (lhs < length && this.heap[lhs].priority < this.heap[smallest].priority) {
            smallest = lhs;//in bounds, priority is smaller 
        }
        if (rhs < length && this.heap[rhs].priority < this.heap[smallest].priority) {
            smallest = rhs;
        }
        if (smallest === index) {return;}   //idx smaller or equal to children

        this.swap(index, smallest);
        index = smallest;
    }
  }
}