declare module 'random-username-generator' {
	interface RandomUsernameGenerator {
		generate(): string;
	}
	const rug: RandomUsernameGenerator;
	export default rug;
}
