import * as React from "react"
import Footer from "./footer"
import Navbar from "./navbar"

const Template = ({children}) => {
	return (
		<div className="h-screen">
      	<Navbar />
			{children}
			<Footer />
		</div>
	)
}

export default Template