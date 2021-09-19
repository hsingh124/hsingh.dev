import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import Template from "../components/template"

const HomePage = () => {
	return (
		<Template>
			<div className="flex h-full justify-center items-center gap-4">
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
				<div className="space-y-3 max-w-prose">
					<p className="text-4xl font-sans font-semibold">Hey! I'm Harpreet Singh</p>
					<p className="text-2xl font-sans font-normal text-justify">
						I am a software engineer in Auckland, New Zealand.
						Here, you can see the projects I work on and read my blogs which are mostly about tech.
						I mostly do full stack web dev but I'm also really interested in computer architecture, network engineering,
						machine learning and FPGAs.
					</p>
					<p className="text-2xl font-sans font-normal text-justify">
						Hope you like my work! 😄
					</p>
				</div>
			</div>
		</Template>
	)
}

export default HomePage
