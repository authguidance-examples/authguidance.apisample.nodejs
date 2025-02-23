import {Request} from 'express';
import {RouteMetadata} from './routeMetadata.js';
import {MetadataArgsStorage} from 'routing-controllers';
import {ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs.js';

/*
 * A helper class to use Routing Controllers metadata at runtime to capture important logging fields
 */
export class RouteMetadataHandler {

    private readonly basePath: string;
    private readonly metadata: MetadataArgsStorage;

    public constructor(basePath: string, metadata: MetadataArgsStorage) {
        this.basePath = basePath;
        this.metadata = metadata;
    }

    /*
     * Calculate route metadata to log for the current request
     */
    public getOperationRouteInfo(request: Request): RouteMetadata | null {

        // Get the request path, such as '/investments/companies/2/transactions' without the query string
        const requestPath = (request.baseUrl + request.path).replace(/\/+$/, '');
        if (requestPath) {

            for (const controller of this.metadata.controllers) {

                for (const action of this.metadata.actions) {

                    if (controller.target === action.target) {

                        // Get the operation path, such as 'investments/companies/:id/transactions'
                        const operationPath = this.basePath + controller.route + action.route;

                        // Return a match if found
                        const routeInfo = this.getMatchingRouteInfo(
                            requestPath,
                            request.method,
                            operationPath,
                            action);

                        if (routeInfo) {
                            return routeInfo;
                        }
                    }
                }
            }
        }

        // Otherwise indicate not found
        return null;
    }

    /*
     * Check for a match on method and path, such as 'GET /investments/companies/2/transactions'
     */
    private getMatchingRouteInfo(
        requestPath: string,
        requestMethod: string,
        operationPath: string,
        action: ActionMetadataArgs): RouteMetadata | null {

        // Check that the HTTP method matches that configured against the operation
        if (action.type.toLowerCase() !== requestMethod.toLowerCase()) {
            return null;
        }

        // Split into parts
        const operationParts = operationPath.split('/');
        const requestParts = requestPath.split('/');
        if (operationParts.length !== requestParts.length) {
            return null;
        }

        // Consider them equal if all path segments match exactly, other than wildcards
        const segments = requestParts.length;
        const resourceIds = [];
        for (let segment = 0; segment < segments; segment++) {

            // Consider REST template parameters to be a match
            if (operationParts[segment].startsWith(':')) {

                // Add to resource ids
                resourceIds.push(requestParts[segment]);
            } else {

                // For non template parameters require an exact match
                if (operationParts[segment] !== requestParts[segment]) {
                    return null;
                }
            }
        }

        // Return the operation name and the REST template parameters, which will be logged
        return {
            operationName: action.method,
            resourceIds,
        };
    }
}
