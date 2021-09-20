import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import Seo from "../components/seo"
import Template from "../components/template"

const HomePage = () => {
	return (
		<Template>
			<div className="flex flex-col h-full justify-center items-center gap-4 my-14 mx-10 sm:my-0 md:flex-row">
				<Seo title="Harpreet Singh" />
				<div className="w-40 max-w-xs md:w-full sm:w-52">
					<StaticImage
						// className="bio-avatar"
						layout="constrained"
						formats={["auto", "webp", "avif"]}
						src="../images/avatar.png"
						// width={333}
						// height={399}
						quality={95}
						alt="Profile picture"
					/>
				</div>
				<div className="space-y-3 max-w-prose">
					<p className="text-3xl font-sans font-semibold">Hey! I'm Harpreet Singh</p>
					<p className="text-xl font-sans font-normal text-justify">
						I am a software engineer in Auckland, New Zealand.
						Here, you can see the projects I work on and read my blogs which are mostly about tech.
						I mostly do full stack web dev but I'm also really interested in computer architecture, network engineering,
						machine learning and FPGAs.
					</p>
					<p className="text-xl font-sans font-normal text-justify">
						Hope you like my work! 😄
					</p>
				</div>
			</div>
		</Template>
	)
}

export default HomePage
