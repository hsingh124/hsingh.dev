import * as React from "react"
import Footer from "./Footer"
import Navbar from "./Navbar"

const Wrapper = ({children}) => {
	return (
		<div className="h-screen">
      	<Navbar />
			{children}
			<Footer />
		</div>
	)
}

export default Wrapper