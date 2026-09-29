import "./Product.css"
import { Price } from "./Price";

function Product({ title, idx }) {
    let oldPrices = ["123", "456", "678"];
    let newPrices = ["1234", "4567", "8900"];
    let des = ["d1", "d2", "d3"]
    return (
        <div className="head">
            <h4>{title}</h4>
            <p>Description:{des[idx]}</p>
            <Price oldPrice={oldPrices[idx]} newPrice={newPrices[idx]} />
        </div>
    )

}
export { Product }