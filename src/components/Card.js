function Card({title, value, subtitle}){
    return(
        <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <h3 className="text-xs" >{title}</h3> {/* card title */}
            <p className="text-2xl font-semibold py-3" >{value}</p> {/* card value - to be an output of Python later */}
            <p className="text-xs text-gray-500" >{subtitle}</p> {/* card value - to be an output of Python later */}
        </div>
    )
}

export default Card;