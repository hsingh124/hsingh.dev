import { Link } from "gatsby";
import * as React from "react"

const Navbar = () => {
	return (
		<div className="fixed">
			<div className="px-4 py-6 w-screen h-10 bg-gray-50">
				<div className="flex h-full items-center gap-2">
					<Link 
						activeClassName="flex items-center justify-center h-8 w-20 bg-gray-200 rounded-md"
						className="flex items-center justify-center h-8 w-20 hover:bg-gray-200 rounded-md"
						to="/"
					>
						Home
					</Link>
					<Link 
						activeClassName="flex items-center justify-center h-8 w-20 bg-gray-200 rounded-md"
						className="flex items-center justify-center h-8 w-20 hover:bg-gray-200 rounded-md"
						to="/blog"
					>
							Blog
						</Link>
					<Link 
						activeClassName="flex items-center justify-center h-8 w-20 bg-gray-200 rounded-md"
						className="flex items-center justify-center h-8 w-20 hover:bg-gray-200 rounded-md"
						to="/about"
					>
						About
					</Link>
				</div>
			</div>
			<hr className="bg-gray-700 h-0.5"></hr>
		</div>
	)
}

export default Navbar;