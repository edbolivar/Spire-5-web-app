/*
A simple handler for routes

var router = new MiniRouter();
router.addTemplate("/cover/{{id}}", (params) => { return xx; });
router.addTemplate("/cover/{{...rest}}", (params) => { return xx; });
var xx = router.handle(uri);
*/

type ParamsObject = {
	[key: string]: any;
};

type HandlerFunction<T> = (params: ParamsObject, param: any) => T | null;

export default class MiniRouter<T> {

	public static PARAMETER_BRACKET_START = "{{";
	public static PARAMETER_BRACKET_END = "}}";
	public static PARAMETER_REST_START = "...";
	public static URI_STEP_DIVIDER = "/";

	private _uriTemplates: string[];						// Possible uri templates
	private _uriTemplateHandlers: HandlerFunction<T>[];		// Handlers for each path template


	// ================================================================================================================
	// CONSTRUCTOR ----------------------------------------------------------------------------------------------------

	constructor() {
		this._uriTemplates = [];
		this._uriTemplateHandlers = [];
	}


	// ================================================================================================================
	// PUBLIC INTERFACE -----------------------------------------------------------------------------------------------

	addTemplate(uriTemplate: string, handler: HandlerFunction<T>) {
		this._uriTemplates.push(uriTemplate);
		this._uriTemplateHandlers.push(handler);
	}

	removeTemplate(uriTemplate: string) {
		let idx = this._uriTemplates.indexOf(uriTemplate);
		while (idx > -1) {
			this._uriTemplates.splice(idx, 1);
			this._uriTemplateHandlers.splice(idx, 1);
			idx = this._uriTemplates.indexOf(uriTemplate);
		}
	}

	handle(uri: string, nonUriParam: any): T | null {
		// Based on a uri, tries to find which uri template is most appropriate for it and return the handler results
		const uriSteps = uri.split(MiniRouter.URI_STEP_DIVIDER);
		let uriTemplateSteps = null;
		let doesMatch = false;
		let paramsObject: ParamsObject | null = null;
		for (let i = 0; i < this._uriTemplates.length; i++) {
			uriTemplateSteps = this._uriTemplates[i].split(MiniRouter.URI_STEP_DIVIDER);

			// Check all steps for matching and builds parameters
			doesMatch = false;
			paramsObject = {};

			// Check for a full match (e.g. "/a/*/b" => "/a/{{id}}/b")
			// Check for rest matches (e.g. "/a/*/b" => "/a/{{...rest}}")
			doesMatch = true;

			for (let j = 0; j < uriTemplateSteps.length; j++) {
				if (j >= uriSteps.length) {
					// No more steps in source uri to match the template
					doesMatch = false;
					break;
				} else if (uriTemplateSteps[j].startsWith(MiniRouter.PARAMETER_BRACKET_START) && uriTemplateSteps[j].endsWith(MiniRouter.PARAMETER_BRACKET_END)) {
					// Is a parameter
					const parameterName = uriTemplateSteps[j].substr(MiniRouter.PARAMETER_BRACKET_START.length, uriTemplateSteps[j].length - MiniRouter.PARAMETER_BRACKET_START.length - MiniRouter.PARAMETER_BRACKET_END.length);
					if (parameterName.startsWith(MiniRouter.PARAMETER_REST_START)) {
						// A rest parameter, add to the object and end
						paramsObject[parameterName.substr(MiniRouter.PARAMETER_REST_START.length)] = uriSteps.slice(j).join(MiniRouter.URI_STEP_DIVIDER);
						break;
					} else {
						// A normal parameter, add to the object
						paramsObject[parameterName] = uriSteps[j];
					}
				} else {
					// A normal string, check for matches
					if (uriSteps[j] != uriTemplateSteps[j]) {
						// No match, breaks prematurely
						doesMatch = false;
						break;
					}
				}

				if (j == uriTemplateSteps.length - 1 && uriSteps.length > uriTemplateSteps.length) {
					// No more steps in template to handle source uri
					doesMatch = false;
				}
			}

			if (doesMatch) {
				// It's a match, return the appropriate handler
				return this._uriTemplateHandlers[i](paramsObject, nonUriParam);
			}
		}

		console.error(`Error: could not find handler for route [${uri}].`);

		return null;
	}
}

