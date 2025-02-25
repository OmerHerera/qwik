import { component$, Resource } from '@builder.io/qwik';
import { useEndpoint, DocumentHead, RequestHandler } from '~qwik-city-runtime';

export default component$(() => {
  const resource = useEndpoint<typeof onGet>();

  return (
    <div>
      <Resource
        resource={resource}
        onResolved={(blog) => (
          <>
            <h1>{blog.blogTitle}</h1>
            <p>{blog.blogContent}</p>
          </>
        )}
      />
    </div>
  );
});

export const onGet: RequestHandler<EndpointData> = async ({ params, request }) => {
  return {
    blogTitle: `Blog: ${params.slug}`,
    blogContent: `${params.slug}, ${request.url}`,
  };
};

export const head: DocumentHead<EndpointData> = ({ data }) => {
  return { title: data?.blogTitle };
};

export interface EndpointData {
  blogTitle: string;
  blogContent: string;
}
