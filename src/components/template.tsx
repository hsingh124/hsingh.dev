import * as React from "react"
import Footer from "./footer"
import Navbar from "./navbar"

const Template = ({children}) => {
	return (
		<div className="h-screen">
			{children}
      	<Navbar />
			<Footer />
		</div>
	)
}

export default Template