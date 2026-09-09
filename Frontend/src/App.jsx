import { useEffect, useState } from 'react'
import { api, getStoredSession, saveSession, clearSession } from './api'
import './App.css'

const emptyForm = { username: '', email: '', password: '', password_confirm: '' }
const emptyProductForm = { name: '', category: '', price: '', description: '', stock: '0', is_recommended: false, image: null }

function App() {
  const [mode, setMode] = useState('login')
  const [session, setSession] = useState(getStoredSession)
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [catalogStatus, setCatalogStatus] = useState('loading')
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [productStatus, setProductStatus] = useState({ type: '', message: '' })
  const [isProductSubmitting, setIsProductSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const storedSession = getStoredSession()
    if (!storedSession?.tokens?.refresh) return
    api.refresh(storedSession.tokens.refresh).then((tokens) => {
      const nextSession = { ...storedSession, tokens }
      saveSession(nextSession)
      setSession(nextSession)
    }).catch(() => { clearSession(); setSession(null) })
  }, [])

  useEffect(() => {
    if (!session) return
    Promise.all([api.categories(), api.products()])
      .then(([categoryData, productData]) => {
        setCategories(categoryData)
        setProducts(productData)
        setCatalogStatus('ready')
      })
      .catch(() => setCatalogStatus('error'))
  }, [session])

  const updateField = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
    setStatus({ type: '', message: '' })
  }

  const updateProductField = (event) => {
    const { name, type, checked, value, files } = event.target
    setProductForm({ ...productForm, [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value })
    setProductStatus({ type: '', message: '' })
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    setIsProductSubmitting(true)
    setProductStatus({ type: '', message: '' })
    const body = new FormData()
    body.append('name', productForm.name)
    body.append('category', productForm.category)
    body.append('price', productForm.price)
    body.append('description', productForm.description)
    body.append('stock', productForm.stock)
    body.append('is_recommended', productForm.is_recommended)
    if (productForm.image) body.append('image', productForm.image)
    try {
      const product = await api.createProduct(body, session.tokens.access)
      setProducts([product, ...products])
      setProductForm({ ...emptyProductForm, category: productForm.category })
      setProductStatus({ type: 'success', message: 'Product saved to Django and SQLite.' })
    } catch (error) {
      setProductStatus({ type: 'error', message: error.message })
    } finally { setIsProductSubmitting(false) }
  }

  const submit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })
    try {
      const response = mode === 'login'
        ? await api.login({ username: form.username, password: form.password })
        : await api.signup({ username: form.username, email: form.email, password: form.password, password_confirm: form.password_confirm })
      if (mode === 'signup') {
        setMode('login')
        setForm({ ...form, password: '', password_confirm: '' })
        setStatus({ type: 'success', message: 'Account created. Sign in to continue.' })
      } else {
        saveSession(response)
        setSession(response)
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally { setIsSubmitting(false) }
  }

  const signOut = () => { clearSession(); setSession(null); setForm(emptyForm) }

  if (session) return (
    <main className="account-shell"><section className="account-panel">
      <div className="brand-mark">EC</div><p className="eyebrow">e-commerce / account</p>
      <h1>Welcome back, {session.user.username}.</h1>
      <p className="lede">Your account is connected to the Django API and ready for the next storefront feature.</p>
      <div className="profile-card"><span className="profile-avatar">{session.user.username.charAt(0).toUpperCase()}</span><div><strong>{session.user.username}</strong><span>{session.user.email || 'No email provided'}</span></div><b>{session.user.role}</b></div>
      {session.user.role === 'admin' && <section className="product-form-section">
        <p className="eyebrow">Admin inventory</p><h2>Add product</h2>
        <form className="product-form" onSubmit={submitProduct}>
          <label>Name<input name="name" value={productForm.name} onChange={updateProductField} required /></label>
          <label>Category<select name="category" value={productForm.category} onChange={updateProductField} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <div className="form-row"><label>Price<input name="price" type="number" min="0" step="0.01" value={productForm.price} onChange={updateProductField} required /></label><label>Stock<input name="stock" type="number" min="0" value={productForm.stock} onChange={updateProductField} required /></label></div>
          <label>Description<textarea name="description" value={productForm.description} onChange={updateProductField} required /></label>
          <label>Image<input name="image" type="file" accept="image/*" onChange={updateProductField} /></label>
          <label className="checkbox-label"><input name="is_recommended" type="checkbox" checked={productForm.is_recommended} onChange={updateProductField} /> Recommended</label>
          {productStatus.message && <p className={`status ${productStatus.type}`}>{productStatus.message}</p>}
          <button className="primary-button" type="submit" disabled={isProductSubmitting}>{isProductSubmitting ? 'Saving...' : 'Save product'}</button>
        </form>
      </section>}
      <section className="catalog-section">
        <div className="catalog-heading"><div><p className="eyebrow">Live from Django</p><h2>Store catalog</h2></div><span className="catalog-count">{products.length} products</span></div>
        <div className="category-list">{categories.map((category) => <span key={category.id}>{category.name}</span>)}</div>
        {catalogStatus === 'loading' && <p className="catalog-message">Loading catalog...</p>}
        {catalogStatus === 'error' && <p className="catalog-message error">Catalog could not be loaded.</p>}
        {catalogStatus === 'ready' && products.length === 0 && <p className="catalog-message">No products have been added yet. Add products from Django admin to see them here.</p>}
        <div className="product-grid">{products.map((product) => <article className="product-card" key={product.id}><div><span className="product-category">{product.category_name}</span><h3>{product.name}</h3><p>{product.description}</p></div><strong>${product.price}</strong></article>)}</div>
      </section>
      <button className="secondary-button" type="button" onClick={signOut}>Sign out</button>
    </section></main>
  )

  return <main className="auth-shell">
    <section className="intro-panel"><div className="brand-mark">EC</div><p className="eyebrow">e-commerce / secure access</p><h1>Everything you need to shop, in one place.</h1><p className="lede">A focused storefront foundation, connected to your Django backend from the first click.</p><div className="feature-list"><span><i>01</i> JWT-secured sessions</span><span><i>02</i> Buyer and admin roles</span><span><i>03</i> Ready for your catalog</span></div></section>
    <section className="auth-panel"><div className="mode-switch" role="tablist" aria-label="Authentication mode"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setStatus({ type: '', message: '' }) }} type="button">Log in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setStatus({ type: '', message: '' }) }} type="button">Create account</button></div>
      <div className="form-heading"><p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the store'}</p><h2>{mode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2></div>
      <form onSubmit={submit}><label>Username<input name="username" value={form.username} onChange={updateField} autoComplete="username" required /></label>{mode === 'signup' && <label>Email<input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /></label>}<label>Password<input name="password" type="password" value={form.password} onChange={updateField} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength="8" /></label>{mode === 'signup' && <label>Confirm password<input name="password_confirm" type="password" value={form.password_confirm} onChange={updateField} autoComplete="new-password" required minLength="8" /></label>}{status.message && <p className={`status ${status.type}`}>{status.message}</p>}<button className="primary-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Connecting...' : mode === 'login' ? 'Enter storefront' : 'Create account'}</button></form><p className="connection-note"><span className="status-dot" /> Connected to Django REST API</p>
    </section>
  </main>
}

export default App
