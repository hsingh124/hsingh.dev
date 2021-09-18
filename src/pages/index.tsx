import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

const HomePage = () => {
	return (
		<div className="flex justify-center items-center gap-4">
			<div>
				<StaticImage
					// className="bio-avatar"
					layout="fixed"
					formats={["auto", "webp", "avif"]}
					src="../images/avatar.png"
					width={333}
					height={399}
					quality={95}
					alt="Profile picture"
				/>
			</div>
			<div>
				<p className="text-6xl font-sans font-bold">Harpreet Singh</p>
				<p className="text-6xl font-mono font-black">Harpreet Singh</p>
			</div>
		</div>
	)
}

export default HomePage
