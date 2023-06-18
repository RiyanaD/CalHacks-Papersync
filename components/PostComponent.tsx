import React from 'react'

interface PostProps {
  authors: string
  title: string
  abstract: string
}

const PostComponent = ({ authors, title, abstract}: PostProps) => {
  return (
    <div className="flex flex-col justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col p-4">
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            className="text-center"
          />
        </div>
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="authors">Authors</label>
          <input
            type="text"
            id="authors"
            value={authors}
            onChange={handleAuthorsChange}
            className="text-center"
          />
        </div>
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="abstract">abstract</label>
          <textarea
            id="abstract"
            value={abstract}
            onChange={handleabstractChange}
            className="text-center"
          ></textarea>
        </div>
        
        <div className="mb-2 p-4 text-center">
          <label className="block pb-3" htmlFor="pdf">PDF</label>
          <input
            type="text"
            id="pdf"
            value={pdf}
            onChange={handlePDFChange}
            className="text-center"
          />
        </div>
        <button type="submit">Create Post</button>
      </form>
    </div>
  )
}

export default PostComponent
