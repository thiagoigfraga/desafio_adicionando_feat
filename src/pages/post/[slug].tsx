import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const postFormatted = {
    ...post,
    first_publication_date: format(
      new Date(post.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
  };

  const totalWords = postFormatted.data.content.reduce((acc, content) => {
    const totalWordsHeading = content.heading
      ? content.heading.split(' ').length
      : 0;

    const wordsBody = content.body.map(bodyWords => {
      return bodyWords.text.split(' ').length;
    });

    const totalWordsBody = wordsBody.reduce((total, words) => {
      return total + words;
    }, 0);

    const total = totalWordsHeading + totalWordsBody;

    return acc + total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Header />
      <img
        src={postFormatted.data.banner.url}
        className={styles.banner}
        alt="banner"
      />
      <section className={styles.container}>
        <article>
          <div className={styles.articleHeader}>
            <h1>{postFormatted.data.title}</h1>
            <div className={styles.info}>
              <FiCalendar size={20} />
              <span>
                <time>{postFormatted.first_publication_date}</time>
              </span>
              <FiUser size={20} />
              <span>{postFormatted.data.author}</span>
              <FiClock size={20} />
              <span>{`${readTime} min`}</span>
            </div>
          </div>
          <div className={styles.articleContent}>
            {postFormatted.data.content.map((cont, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <article key={index}>
                  <h2>{cont.heading}</h2>
                  <div
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(cont.body),
                    }}
                  />
                </article>
              );
            })}
          </div>
        </article>
      </section>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
