export class UndoManager{
    constructor(){

        this.stack =[]
    }

    add(e){
        this.stack.push(e)
    }

    remove(){
        let e = this.stack.pop();
        return e;
    }
}