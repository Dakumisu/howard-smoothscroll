/**
 * It returns a deferred promise that has a resolve and reject function attached to it
 * @returns A deferred promise that can be resolved or rejected.
 * @type {Promise<{resolve: (value: any) => void, reject: (value: any) => void}}>}
 */
export function deferredPromise() {
	let resolve, reject;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	promise.resolve = resolve;
	promise.reject = reject;
	return promise;
}
