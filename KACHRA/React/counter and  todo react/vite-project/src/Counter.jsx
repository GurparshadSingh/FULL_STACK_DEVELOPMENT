import { useState } from "react";

export default function Counter() {

    let [count, setCount] = useState(0);

    function incCount() {
        setCount(count + 1);
    }

    function decCount() {
        if (count > 0) {
            setCount(count - 1);
        }
    }

    function resetCount() {
        setCount(0);
    }


    return (
        <div>

            <h1 style={{ fontWeight: 800 }}>Count: {count}</h1>
            <button onClick={incCount}><i class="fa-solid fa-plus"></i></button>
            <button onClick={decCount} disabled={count === 0} ><i class="fa-solid fa-minus"></i></button>
            <button onClick={resetCount}><i class="fa fa-refresh" aria-hidden="true"></i></button>

        </div>
    );
}