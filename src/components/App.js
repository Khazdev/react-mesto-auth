import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import React, {useEffect, useState} from "react";
import ImagePopup from "./ImagePopup";
import {api} from "../utils/Api";
import {authApi} from "../utils/AuthApi";
import {CurrentUserContext} from "../contexts/CurrentUserContext.js";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup"
import {Route, Routes, useNavigate} from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import Register from "./Register";
import Login from "./Login";
import InfoTooltip from "./InfoTooltip";

function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isInfoTooltipPopupOpen, setIsInfoTooltipPopupOpen] = useState(false);
  const [isSuccessInfoTooltipStatus, setIsSuccessInfoTooltipStatus] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [email, setEmail] = useState("");
  const localLoggedIn = !!localStorage.getItem('loggedIn')
  const [isLoggedIn, setIsLoggedIn] = useState(localLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    handleValidateToken();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/")
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    api
      .getUserInfo()
      .then((response) => {
        setCurrentUser(response);
      })
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    api
      .getInitialCards()
      .then((cardData) => {
        setCards(cardData);
      })
      .catch((error) => console.log(error));
  }, []);

  const handleUpdateUser = ({name, about}) => {
    api
      .updateProfile(name, about)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSignUp = (email, password) => {
    authApi.signUp(email, password)
      .then((res) => {
        setIsSuccessInfoTooltipStatus(true);
        openInfoTooltip();
        setTimeout(() => {
          closeAllPopups();
          navigate("/sign-in");
        }, 2000)
      })
      .catch((error) => {
        console.log("response? catch")
        console.log(error);
        setIsSuccessInfoTooltipStatus(false);
        openInfoTooltip();
      })
  }

  const openInfoTooltip = () => {
    setIsInfoTooltipPopupOpen(true);
  }

  const handleSignIn = (email, password) => {
    authApi.signIn(email, password)
      .then((res) => {
        localStorage.setItem("jwt", res.token);
        setEmail(email);
        setIsLoggedIn(true)
        navigate('/')
      })
      .catch((error) => {
        console.log(error);
      })
  }

  const handleValidateToken = () => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      authApi.validToken(jwt)
        .then((res) => {
          setEmail(res.data.email)
          localStorage.setItem('loggedIn', "true")
          setIsLoggedIn(true)
          navigate('/')
        })
        .catch((error) => {
          console.log(error);
        })
    }
  }

  function handleSignOut() {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    setEmail("")
    localStorage.setItem('loggedIn', "")
    navigate("/sign-in");
  }

  const handleUpdateAvatar = ({avatar}) => {
    api
      .updateAvatar(avatar)
      .then((data) => {
        setCurrentUser(data);
        closeAllPopups();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setImagePopupOpen(true);
  };

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function closeAllPopups() {
    setIsEditAvatarPopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditProfilePopupOpen(false);
    setSelectedCard(null);
    setImagePopupOpen(false);
    setIsInfoTooltipPopupOpen(false);
  }

  function handleCardLike(card) {
    // Снова проверяем, есть ли уже лайк на этой карточке
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    api
      .changeLikeCardStatus(card._id, isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c)),
        );
      })
      .catch((error) => console.log(error));
  }

  function handleCardDelete(card) {
    const isOwn = card.owner._id === currentUser._id;
    if (isOwn) {
      api
        .deleteCard(card._id)
        .then(() => {
          setCards((prevCards) => prevCards.filter((c) => c._id !== card._id));
        })
        .catch((error) => console.log(error));
    }
  }

  function handleAddPlaceSubmit({name, link}) {
    api
      .addCard(name, link)
      .then((res) => {
        setCards([res, ...cards])
        closeAllPopups();
      })
      .catch((error) => console.log(error));
  }

  return (
    <>
      <CurrentUserContext.Provider value={currentUser}>
        <Header email={email} signOut={handleSignOut}/>
        <Routes>
          <Route exact path="/" element={<ProtectedRoute element={Main}
                                                         isLoggedIn={isLoggedIn}
                                                         onEditProfile={handleEditProfileClick}
                                                         onAddPlace={handleAddPlaceClick}
                                                         onEditAvatar={handleEditAvatarClick}
                                                         onCardClick={handleCardClick}
                                                         onLikeClick={handleCardLike}
                                                         onDeleteClick={handleCardDelete}
                                                         cards={cards}/>}>
          </Route>
          <Route path="/sign-up" element={<Register onRegister={handleSignUp}/>}/>
          <Route path="/sign-in" element={<Login onLogin={handleSignIn}/>}/>
        </Routes>

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />

        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />

        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <ImagePopup
          card={selectedCard}
          onClose={closeAllPopups}
          isOpened={imagePopupOpen}
        />

        <InfoTooltip
          isOpen={isInfoTooltipPopupOpen}
          onClose={closeAllPopups}
          isConfirmStatus={isSuccessInfoTooltipStatus}
        />

        <Footer/>
      </CurrentUserContext.Provider>
    </>
  );
}

export default App;
