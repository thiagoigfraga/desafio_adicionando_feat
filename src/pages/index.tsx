import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import { useState } from 'react';

import { FiUser, FiCalendar } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const dataFormatted = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  const [posts, setPosts] = useState(dataFormatted);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const fetchPosts = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    setNextPage(fetchPosts.next_page);
    setCurrentPage(fetchPosts.page);

    const updatedPosts = fetchPosts.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts([...posts, ...updatedPosts]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={styles.main}>
        <Header />
        <section className={styles.container}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <article>
                <a>
                  <h1>{post.data.title}</h1>
                </a>
                <p>{post.data.subtitle}</p>

                <div className={styles.info}>
                  <FiCalendar size={20} />
                  <span>
                    <time>{post.first_publication_date}</time>
                  </span>
                  <FiUser size={20} />
                  <span>{post.data.author}</span>
                </div>
              </article>
            </Link>
          ))}
          {nextPage && (
            <button
              type="button"
              onClick={handleNextPage}
              className={styles.highlight}
            >
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
