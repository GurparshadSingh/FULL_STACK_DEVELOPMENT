import { useState } from "react";

export default function Counter() {
    let [isLiked, setIsLiked] = useState(false);
    function clicked() {
        setIsLiked(!isLiked);
    }
    return (
        <div>
            <p onClick={clicked}> {isLiked ? <i className="fa-solid fa-heart"></i> : <i className="fa-regular fa-heart"></i>}</p>
        </div>
    );
}