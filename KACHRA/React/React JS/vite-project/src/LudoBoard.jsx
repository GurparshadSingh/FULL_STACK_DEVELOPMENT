import { useState } from "react"

export default function LudoBoard() {
    let [moves, setMoves] = useState({ Blue: 0, Yellow: 0, Green: 0, Red: 0 })

    let updateBlue = () => {
        setMoves({ ...moves, Blue: moves.Blue + 1 })
    }
    let updateYellow = () => {
        setMoves({ ...moves, Yellow: moves.Yellow + 1 })
    }
    return (
        <div>
            <p>Game Begins!</p>
            <div className="board">
                <p >Blue moves = {moves.Blue}</p>
                <button style={{ backgroundColor: "blue" }} onClick={updateBlue}>+1</button>

                <p >Yellow moves = {moves.Yellow}</p>
                <button style={{ marginBottom: "10px", backgroundColor: "yellow" }} onClick={updateYellow}>+1</button>

            </div>
        </div>
    )
}