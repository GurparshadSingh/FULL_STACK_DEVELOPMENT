function Price({ oldPrice, newPrice }) {
    let oldStyles = {
        textDecoration: "line-through"
    }
    let newStyles = {
        fontWeight: "700"
    }
    return (

        <div>
            <span style={oldStyles}>old:{oldPrice} </span>
            <br />


            <span style={newStyles}>new:{newPrice}</span>

        </div>

    )
}
export { Price }