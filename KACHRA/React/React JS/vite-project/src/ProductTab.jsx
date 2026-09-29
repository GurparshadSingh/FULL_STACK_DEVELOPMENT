import { Product } from "./Product";

function ProductTab(params) {
    let styles = {
        display: "flex",
        flexWrap: "wrap"
    }
    return (
        <div style={styles}>
            <Product title="Logitech Mx master" idx={0} />
            <Product title="Zebronics zeb-transformer" idx={1} />
            <Product title="Apple pencil (gen 2)" idx={2} />
        </div>
    )
}
export { ProductTab }