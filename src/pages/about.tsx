import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"
import Template from "../components/template"

export default function About() {
	return (
		<Template>
			<div className="py-32 flex justify-center items-center h-screen">
				<div className="max-w-prose">
					<div className="text-4xl text-center font-sans font-semibold">About me</div>
					<div className="text-1xl text-gray-400 text-center font-sans font-semibold">Computer/Software Engineer</div>
					<div className="my-10 text-1xl font-sans font-medium text-justify">
						I am a software engineer based in Auckland, New Zealand. Most of my work involves full stack
						web development but I'm also really interested in machine learning, high performance computing and low level
						software dev like firmwares, networks (protocols and stuff), etc. I also really enjoy working on
						hardware projects involving FPGAs, embedded systems, etc.
					</div>
					<div className="text-2xl font-sans font-semibold">Connect</div>
					<div className="my-2 text-1xl font-sans font-medium text-justify">
						You can connect with me via email:
						<a className="font-semibold hover:text-green-600" href="mailto:harpreetsinghdev13@gmail.com"> harpreetsinghdev13@gmail.com</a>
						or through the below mentioned links.
					</div>
					<div>
						<div><a className="text-lg font-sans font-semibold hover:text-green-600" href="https://github.com/hsingh124">GitHub</a></div>
						<div><a className="text-lg font-sans font-semibold hover:text-green-600" href="https://www.linkedin.com/in/singh9600/">LinkedIn</a></div>
					</div>
				</div>
			</div>
		</Template>
	)
}
